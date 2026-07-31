import express from "express";
import { Client, GatewayIntentBits } from 'discord.js';
import { decrypt, encrypt, discordClients, invalidateBotConfigCache, getDiscordClient, setupInteractionHandler } from './common';
import { loadDb, saveDb } from './localDb';

const router = express.Router();

router.get('/status/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const client = await getDiscordClient(groupID);
    res.json({ connected: client !== null && client.isReady() });
  } catch (error) {
    console.error('Error checking bot status:', error);
    res.json({ connected: false });
  }
});

router.get('/bot-config/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const data = (groupObj && groupObj.configs && groupObj.configs.discord) 
      ? groupObj.configs.discord 
      : { token: '', guildId: '', channelId: '', channels: [] };
    
    // Create a copy so we do not mutate the database cache directly
    const responseData = { ...data };
    
    if (responseData.token) {
      try {
        responseData.token = decrypt(responseData.token);
      } catch (e) {
        responseData.token = '';
      }
    }
    res.json(responseData);
  } catch (error) {
    res.json({ token: '', guildId: '', channelId: '', channels: [] });
  }
});

router.post('/bot-config/:groupID/channel', async (req, res) => {
  try {
    const { groupID } = req.params;
    const { channelId } = req.body;
    
    const localData = loadDb();
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].configs) {
      localData.groups[groupID].configs = {};
    }
    if (!localData.groups[groupID].configs!.discord) {
      localData.groups[groupID].configs!.discord = { token: '', guildId: '', channelId: '', channels: [] };
    }
    
    localData.groups[groupID].configs!.discord!.channelId = channelId;
    saveDb(localData);
    
    invalidateBotConfigCache(groupID);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

router.post('/bot-config/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const { token, guildId, channelId, pollChannelId, channels } = req.body;
    
    const encryptedToken = encrypt(token || '');
    
    const localData = loadDb();
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].configs) {
      localData.groups[groupID].configs = {};
    }
    
    // GIỮ nguyên phần cũ rồi mới ghi đè. Trước đây gán thẳng một object mới nên mọi thiết
    // lập không nằm trong form này (voiceNguon...) bị xoá sạch mỗi lần lưu cấu hình bot.
    localData.groups[groupID].configs!.discord = {
      ...(localData.groups[groupID].configs!.discord || {}),
      token: encryptedToken,
      guildId,
      channelId,
      pollChannelId: pollChannelId || '',
      channels: channels || []
    };
    
    saveDb(localData);
    
    invalidateBotConfigCache(groupID);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save bot config:', error);
    res.status(500).json({ error: 'Failed to save bot config' });
  }
});

// Lưu NGUỒN VOICE: những kênh đang tick, và kênh nào ứng với khu nào.
// Để riêng khỏi form Cấu hình Discord vì nó đổi liên tục theo từng buổi đánh, còn token và
// guild id thì đặt một lần rồi thôi. Bắt mở modal chỉ để tick kênh là phiền.
router.post('/bot-config/:groupID/voice-nguon', async (req, res) => {
  try {
    const { groupID } = req.params;
    const { chon, gan, chiThanhVien } = req.body as
      { chon?: string[]; gan?: Record<string, string>; chiThanhVien?: boolean };

    const localData = loadDb();
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].configs) localData.groups[groupID].configs = {};
    if (!localData.groups[groupID].configs!.discord) {
      localData.groups[groupID].configs!.discord = { token: '', guildId: '', channelId: '', channels: [] };
    }

    localData.groups[groupID].configs!.discord!.voiceNguon = {
      chon: Array.isArray(chon) ? chon.filter((v) => typeof v === 'string') : [],
      gan: gan && typeof gan === 'object' ? gan : {},
      chiThanhVien: chiThanhVien !== false,
    };
    saveDb(localData);

    invalidateBotConfigCache(groupID);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save voice source:', error);
    res.status(500).json({ error: 'Không lưu được nguồn voice' });
  }
});

router.post('/connect/:groupID', async (req, res) => {
  const { groupID } = req.params;
  let client = discordClients.get(groupID);
  
  if (client) {
    try {
      client.destroy();
    } catch (e) {}
    discordClients.delete(groupID);
  }

  try {
    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const data = (groupObj && groupObj.configs && groupObj.configs.discord) ? groupObj.configs.discord : {};
    
    let token = '';
    try {
      token = decrypt(data.token || '');
    } catch (e) {
      return res.status(400).json({ error: 'Không thể giải mã Token. Vui lòng lưu lại cấu hình.' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc trống.' });
    }

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

    const connectionResult = new Promise<{ success: boolean; error?: string; canhBao?: string }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Kết nối quá hạn (Timeout). Hãy kiểm tra Token và Internet.' });
      }, 30000);

      newClient.once('clientReady', async () => {
        clearTimeout(timeout);
        console.log(`Bot logged in as ${newClient.user?.tag} for group ${groupID}`);
        setupInteractionHandler(newClient, groupID);
        
        try {
          const guild = await newClient.guilds.fetch(data.guildId).catch(err => {
            console.error(`Failed to fetch guild ${data.guildId}:`, err);
            return null;
          });
          
          if (!guild) {
            resolve({ success: false, error: `Bot không có trong Server (Guild ID: ${data.guildId}). Hãy mời Bot vào Server trước.` });
            return;
          }

          // ⚠️ channels.fetch() KHÔNG có id thì trả về COLLECTION của mọi kênh, không phải
          // một kênh. Gọi .isVoiceBased() trên Collection là TypeError, rồi bị catch ngoài
          // nuốt thành "Lỗi khi tham gia kênh voice: channel.isVoiceBased is not a function"
          // -> thông báo chỉ sai hoàn toàn chỗ hỏng. Phải chặn từ đây.
          //
          // Và CỐ Ý cho kết nối khi CHƯA chọn kênh: danh sách kênh chỉ lấy được sau khi bot
          // đăng nhập, mà trước đây lại bắt buộc phải có kênh mới cho kết nối. Vòng luẩn
          // quẩn: muốn chọn kênh phải kết nối, muốn kết nối phải chọn kênh.
          if (!data.channelId) {
            resolve({ success: true, canhBao: 'Đã kết nối bot, nhưng CHƯA chọn kênh voice. Chọn kênh ở ô bên cạnh rồi lưu lại.' });
            return;
          }

          const channel = await guild.channels.fetch(data.channelId).catch(err => {
            console.error(`Failed to fetch channel ${data.channelId}:`, err);
            return null;
          });

          // Kênh KHÔNG phải voice thì chỉ CẢNH BÁO, đừng chặn kết nối.
          // Voice chỉ cần cho đúng một thứ: nguồn "Online (Discord)" lấy danh sách từ người
          // đang ngồi trong kênh. Còn kết nối bot, đăng poll, đăng đội hình, nguồn "Thành
          // viên" thì không liên quan gì tới voice. Chặn ở đây là khoá luôn người chỉ muốn
          // dùng mấy tính năng kia.
          if (!channel) {
            resolve({ success: false, error: `Không tìm thấy kênh (ID: ${data.channelId}), hoặc bot không có quyền xem kênh đó.` });
          } else if (typeof (channel as any).isVoiceBased !== 'function' || !(channel as any).isVoiceBased()) {
            resolve({
              success: true,
              canhBao: 'Đã kết nối. Kênh mặc định đang chọn KHÔNG phải kênh voice, nên nguồn "Online (Discord)" sẽ trống. '
                + 'Muốn dùng nguồn đó thì chọn một kênh voice; còn poll, đội hình và nguồn "Thành viên" vẫn chạy bình thường.',
            });
          } else {
            resolve({ success: true });
          }
        } catch (err: any) {
          resolve({ success: false, error: `Lỗi khi tham gia kênh voice: ${err.message}` });
        }
      });

      newClient.once('error', (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: `Lỗi Discord Client: ${err.message}` });
      });
    });

    try {
      await newClient.login(token);
      const result = await connectionResult;
      
      if (result.success) {
        discordClients.set(groupID, newClient);
        res.json({ success: true, canhBao: result.canhBao });
      } else {
        newClient.destroy();
        res.status(400).json({ error: result.error });
      }
    } catch (loginErr: any) {
      res.status(400).json({ error: `Đăng nhập thất bại: ${loginErr.message}. Kiểm tra lại Token.` });
    }
  } catch (error: any) {
    res.status(500).json({ error: `Lỗi hệ thống: ${error.message}` });
  }
});

router.post('/disconnect/:groupID', async (req, res) => {
  const { groupID } = req.params;
  const client = discordClients.get(groupID);
  if (client) {
    client.destroy();
    discordClients.delete(groupID);
  }
  res.json({ success: true });
});

export default router;
