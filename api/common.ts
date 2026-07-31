import { Client, GatewayIntentBits, GuildMember } from 'discord.js';
import crypto from 'crypto';
import fsSync from 'fs';
import path from 'path';

// ⚠️ Khoá này mã hoá TOKEN BOT DISCORD của từng bang. Khoá mặc định nằm ngay trong mã
// nguồn, nên ai đọc được repo là giải mã được hết. Chạy máy nhà thì tạm chấp nhận, nhưng
// deploy mà quên đặt biến thì coi như không mã hoá gì cả -> chặn thẳng ở production.
if (!process.env.ENCRYPTION_KEY) {
  const loi = 'ENCRYPTION_KEY chưa được đặt. Token Discord sẽ mã hoá bằng khoá mặc định ghi cứng trong mã nguồn.';
  if (process.env.NODE_ENV === 'production') {
    console.error(`[FATAL] ${loi} Từ chối khởi động.`);
    process.exit(1);
  }
  console.warn(`[CẢNH BÁO] ${loi} Chỉ dùng được ở máy cá nhân.`);
}
const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || '12345678901234567890123456789012').padEnd(32, '0').substring(0, 32);
const IV_LENGTH = 16;

export function normalizeDiscordName(str: string): string {
  if (!str) return '';
  // normalize('NFKD') handles most fullwidth and accented characters
  let normalized = str.normalize('NFKD');
  
  // mathMap for specific mathematical alphanumeric symbols not handled by NFKD
  const mathMap: Record<string, string> = {
    '𝗔': 'A', '𝗕': 'B', '𝗖': 'C', '𝗗': 'D', '𝗘': 'E', '𝗙': 'F', '𝗚': 'G', '𝗛': 'H', '𝗜': 'I', '𝗝': 'J', '𝗞': 'K', '𝗟': 'L', '𝗠': 'M', '𝗡': 'N', '𝗢': 'O', '𝗣': 'P', '𝗤': 'Q', '𝗥': 'R', '𝗦': 'S', '𝗧': 'T', '𝗨': 'U', '𝗩': 'V', '𝗪': 'W', '𝗫': 'X', '𝗬': 'Y', '𝗭': 'Z',
    '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g', '𝗵': 'h', '𝗶': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p', '𝗾': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', '𝘂': 'u', 'ｖ': 'v', '𝘄': 'w', '𝘅': 'x', 'ｙ': 'y', '𝘇': 'z',
    '𝘈': 'A', '𝘉': 'B', '𝘊': 'C', '𝘋': 'D', '𝘌': 'E', '𝘍': 'F', '𝘎': 'G', '𝘏': 'H', '𝘐': 'I', '𝘑': 'J', '𝘒': 'K', '𝘓': 'L', '𝘔': 'M', '𝕹': 'N', '𝘖': 'O', '𝘗': 'P', '𝘘': 'Q', 'ℝ': 'R', '𝘚': 'S', '𝘛': 'T', '𝘜': 'U', '𝘝': 'V', '𝘞': 'W', '𝘟': 'X', '𝘠': 'Y', 'ℤ': 'Z',
    '𝘢': 'a', '𝘣': 'b', '𝘤': 'c', '𝘥': 'd', '𝘦': 'e', '𝘧': 'f', '𝘨': 'g', '𝘩': 'h', '𝘪': 'i', '𝘫': 'j', '𝘬': 'k', '𝘭': 'l', '𝘮': 'm', '𝘯': 'n', '𝘰': 'o', '𝘱': 'p', '𝘲': 'q', '𝘳': 'r', '𝘴': 's', '𝘵': 't', '𝓊': 'u', '𝓋': 'v', '𝓌': 'w', '𝔁': 'x', '𝔂': 'y', '𝔃': 'z',
  };

  let result = '';
  for (const char of normalized) {
    result += mathMap[char] || char;
  }
  return result;
}

export function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export const discordClients = new Map<string, Client>();
export const botConfigCache = new Map<string, { data: any, timestamp: number }>();
export const BOT_CONFIG_CACHE_TTL = 60 * 1000;

export function invalidateBotConfigCache(groupID: string) {
  botConfigCache.delete(groupID);
}

export async function getDiscordClient(groupID: string): Promise<Client | null> {
  let client = discordClients.get(groupID);
  if (client && client.isReady()) return client;
  return null;
}

export const CACHE_TTL = 15000;
export const membersCache: Record<string, { data: any, timestamp: number }> = {};
export const pollResultsCache: Record<string, { data: any, timestamp: number }> = {};

export const handledInteractions = new Set<string>();

import { loadDb } from './localDb';

export async function autoConnectBots() {
  try {
    const localData = loadDb();
    for (const groupID of ['1', '2']) {
      console.log(`Checking bot config for group ${groupID}...`);
      const data = localData.groups[groupID]?.configs?.discord;
      if (data && data.token && data.guildId && data.channelId) {
        console.log(`Auto-connecting bot for group ${groupID}...`);
        try {
          let token = '';
          try {
            token = decrypt(data.token);
          } catch (decryptErr) {
            console.warn(`[Group ${groupID}] Không thể giải mã Token Discord.`);
            continue;
          }

          if (!token) continue;

          const newClient = new Client({
            intents: [
              GatewayIntentBits.Guilds,
              GatewayIntentBits.GuildVoiceStates,
              GatewayIntentBits.GuildMembers,
            ]
          });

          newClient.on('error', (err) => {
            console.error(`Discord Client Error (Group ${groupID}):`, err);
          });

          newClient.once('clientReady', async () => {
            console.log(`Bot auto-logged in as ${newClient.user?.tag} for group ${groupID}`);
            setupInteractionHandler(newClient, groupID);
            discordClients.set(groupID, newClient);
          });

          await newClient.login(token);
        } catch (err) {
          console.error(`Failed to auto-connect bot for group ${groupID}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error during auto-connect:', err);
  }
}

export function setupInteractionHandler(client: Client, groupID: string) {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return;

      if (handledInteractions.has(interaction.id)) return;
      handledInteractions.add(interaction.id);
      setTimeout(() => handledInteractions.delete(interaction.id), 60000);

      const localData = loadDb();

      if (interaction.commandName === 'dangky') {
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          return;
        }

        try {
          const userId = interaction.user.id;
          const nickname = interaction.member instanceof GuildMember ? interaction.member.displayName : interaction.user.username;
          
          const isBang1 = interaction.member instanceof GuildMember && interaction.member.roles.cache.some(role => role.name === 'Thành Viên Bang 1');
          const isBang2 = interaction.member instanceof GuildMember && interaction.member.roles.cache.some(role => role.name === 'Thành Viên Bang 2');
          
          let domain = process.env.MY_CUSTOM_URL || process.env.APP_URL || 'https://ais-pre-ippg3htyqorcfpmlaqdamr-22768551149.asia-east1.run.app';
          if (domain.endsWith('/')) domain = domain.slice(0, -1);
          
          const links: string[] = [];
          const unconfigured: string[] = [];

          if (isBang1) {
            const data1 = localData.groups['1']?.configs?.discord;
            if (data1 && data1.token) {
              links.push(`- [Đăng ký Nhóm 1 (Bang 1)](${domain}/update?id=${userId}&groupID=1)`);
            } else {
              unconfigured.push('Nhóm 1 (Bang 1)');
            }
          }

          if (isBang2) {
            const data2 = localData.groups['2']?.configs?.discord;
            if (data2 && data2.token) {
              links.push(`- [Đăng ký Nhóm 2 (Bang 2)](${domain}/update?id=${userId}&groupID=2)`);
            } else {
              unconfigured.push('Nhóm 2 (Bang 2)');
            }
          }

          if (!isBang1 && !isBang2) {
            links.push(`- [Đăng ký thông tin](${domain}/update?id=${userId}&groupID=${groupID})`);
          }

          let replyContent = `Chào ${nickname}!\n`;
          if (links.length > 0) {
            replyContent += `Bạn có thể đăng ký thông tin vũ khí, vai trò và vị trí của mình tại các link sau:\n${links.join('\n')}`;
          }

          if (unconfigured.length > 0) {
            replyContent += `\n\n⚠️ Các nhóm sau chưa được cấu hình trên server: ${unconfigured.join(', ')}. Vui lòng liên hệ Admin.`;
          }
          
          await interaction.editReply({ content: replyContent });
        } catch (cmdError: any) {
          if (cmdError.code === 40060 || cmdError.code === 10062) return;
          console.error('Error in dangky command:', cmdError);
          await interaction.editReply({
            content: `Đã xảy ra lỗi khi xử lý lệnh: ${cmdError.message}`
          }).catch(console.error);
        }
        return;
      }

      if (interaction.commandName === 'xepnhom') {
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: true });
          }
        } catch (e) {
          return;
        }

        const nickname = interaction.member instanceof GuildMember ? interaction.member.displayName : interaction.user.username;
        const isDuongChu = interaction.member instanceof GuildMember && interaction.member.roles.cache.some(role => role.name === 'Đường Chủ');
        const isBang1 = interaction.member instanceof GuildMember && interaction.member.roles.cache.some(role => role.name === 'Thành Viên Bang 1');
        const isBang2 = interaction.member instanceof GuildMember && interaction.member.roles.cache.some(role => role.name === 'Thành Viên Bang 2');
        
        let domain = process.env.MY_CUSTOM_URL || process.env.APP_URL || 'https://ais-pre-ippg3htyqorcfpmlaqdamr-22768551149.asia-east1.run.app';
        if (domain.endsWith('/')) domain = domain.slice(0, -1);
        
        if (!isDuongChu) {
          try {
            await interaction.editReply({
              content: `Xin lỗi ${nickname}, Chỉ "Đường Chủ" mới có thể sử dụng lệnh này.\nBạn có thể truy cập vào website quản lý nhóm tại đây: [Website URL](${domain})`
            });
          } catch (e) {}
          return;
        }

        if (!isBang1 && !isBang2) {
          try {
            await interaction.editReply({
              content: `Xin lỗi Đường Chủ ${nickname}, bạn chưa được phân bổ vào bang nào (Thành Viên Bang 1 hoặc 2). Vui lòng liên hệ Admin để được cấp quyền.\nBạn có thể truy cập vào website quản lý nhóm tại đây: [Website URL](${domain})`
            });
          } catch (e) {}
          return;
        }
        
        const links: string[] = [];
        const unconfigured: string[] = [];

        if (isBang1) {
          const data1 = localData.groups['1']?.configs?.discord;
          if (data1 && data1.token) {
            const authData1 = JSON.stringify({ groupID: '1', nickname, timestamp: Date.now(), rule: 1 });
            const token1 = encrypt(authData1);
            links.push(`- [Truy cập Nhóm 1 (Bang 1)](${domain}/?group=1&token=${encodeURIComponent(token1)})`);
          } else {
            unconfigured.push('Nhóm 1 (Bang 1)');
          }
        }

        if (isBang2) {
          const data2 = localData.groups['2']?.configs?.discord;
          if (data2 && data2.token) {
            const authData2 = JSON.stringify({ groupID: '2', nickname, timestamp: Date.now(), rule: 1 });
            const token2 = encrypt(authData2);
            links.push(`- [Truy cập Nhóm 2 (Bang 2)](${domain}/?group=2&token=${encodeURIComponent(token2)})`);
          } else {
            unconfigured.push('Nhóm 2 (Bang 2)');
          }
        }

        let replyContent = `Chào Đường Chủ ${nickname}!\n`;
        if (links.length > 0) {
          replyContent += `Bạn có quyền truy cập hệ thống xếp nhóm:\n${links.join('\n')}\n`;
        }
        if (unconfigured.length > 0) {
          replyContent += `\n⚠️ Các nhóm sau chưa được cấu hình trên server: ${unconfigured.join(', ')}. Vui lòng liên hệ Admin.`;
        }
        if (links.length === 0 && unconfigured.length > 0) {
          replyContent = `Xin lỗi Đường Chủ ${nickname}, nhóm của bạn (${unconfigured.join(', ')}) chưa được cấu hình trên server. Vui lòng liên hệ Admin để thiết lập.`;
        }

        try {
          await interaction.editReply({ content: replyContent });
        } catch (e) {
          console.error('Error editing reply:', e);
        }
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
    }
  });
}
