import express from "express";
import { normalizeDiscordName, getDiscordClient, membersCache, CACHE_TTL, botConfigCache, BOT_CONFIG_CACHE_TTL, discordClients } from './common';
import { loadDb } from './localDb';

const router = express.Router();

router.get('/members/:groupID', async (req, res) => {
  const { groupID } = req.params;
  
  if (!groupID || groupID === 'undefined' || groupID === 'null') {
    return res.status(400).json({ error: 'Invalid groupID' });
  }

  const client = await getDiscordClient(groupID);
  if (!client || !client.isReady()) {
    return res.status(400).json({ error: 'Bot is not connected' });
  }

  const channelID = req.query.channelID as string;
  const cacheKey = `${groupID}:${channelID || 'default'}`;

  if (membersCache[cacheKey] && Date.now() - membersCache[cacheKey].timestamp < CACHE_TTL) {
    return res.json(membersCache[cacheKey].data);
  }

  try {
    let guildId, channelId;

    let botConfig = botConfigCache.get(groupID);
    if (!botConfig || Date.now() - botConfig.timestamp > BOT_CONFIG_CACHE_TTL) {
      const localData = loadDb();
      const data = localData.groups[groupID]?.configs?.discord || {};
      botConfig = { data, timestamp: Date.now() };
      botConfigCache.set(groupID, botConfig);
    }

    const data = botConfig.data;
    guildId = data.guildId;
    channelId = channelID || data.channelId;

    if (!guildId || !channelId) {
      console.error(`[Members API] Missing config for group ${groupID}: guildId=${guildId}, channelId=${channelId}`);
      return res.status(400).json({ error: 'Thiếu cấu hình Guild ID hoặc Channel ID' });
    }

    const guild = await client.guilds.fetch(guildId).catch(err => {
      console.error(`[Members API] Failed to fetch guild ${guildId}:`, err);
      return null;
    });
    
    if (!guild) {
      console.error(`[Members API] Guild not found or bot not in guild: ${guildId}`);
      return res.status(404).json({ error: `Không tìm thấy Server Discord (ID: ${guildId}). Hãy đảm bảo Bot đã tham gia Server.` });
    }

    const channel = await guild.channels.fetch(channelId).catch(err => {
      console.error(`[Members API] Failed to fetch channel ${channelId}:`, err);
      return null;
    });

    if (!channel) {
      console.error(`[Members API] Channel not found: ${channelId}`);
      return res.status(404).json({ error: `Không tìm thấy kênh Discord (ID: ${channelId}).` });
    }

    if (!channel.isVoiceBased()) {
      console.error(`[Members API] Channel is not voice-based: ${channelId} (type: ${channel.type})`);
      // Thông báo phải NÓI CÁCH SỬA. Bản cũ chỉ báo "không phải kênh Voice" rồi thôi, người
      // dùng không biết ô nào đang trỏ sai, cũng không biết là có đường vòng khác.
      const ten = (channel as any).name ? `#${(channel as any).name}` : `ID ${channelId}`;
      return res.status(400).json({
        error: `Nguồn "Đang trong kênh voice" cần một kênh VOICE, nhưng ${ten} là kênh chữ. `
          + 'Cách sửa: đổi ô chọn kênh trên thanh tiêu đề sang một kênh voice, '
          + 'hoặc chuyển nguồn ở cột trái sang "Thành viên" nếu bạn không dùng danh sách theo voice.',
      });
    }

    const voiceChannel = channel as any;
    if (!voiceChannel.members) {
      console.error(`[Members API] voiceChannel.members is undefined for channel ${channelId}`);
      return res.status(500).json({ error: 'Không thể lấy danh sách thành viên từ kênh Voice.' });
    }

    const members = voiceChannel.members
      .filter((m: any) => m && m.user && !m.user.bot)
      .map((m: any) => ({
        id: m.id,
        name: normalizeDiscordName(m.displayName || m.user.username),
        avatar: m.user.displayAvatarURL()
      }));

    const result = { members };
    membersCache[cacheKey] = { data: result, timestamp: Date.now() };
    res.json(result);
  } catch (error: any) {
    console.error(`[Members API] Error fetching members for group ${groupID}:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/discord-profile/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    
    let clientToUse = null;
    for (const client of discordClients.values()) {
      if (client && client.isReady()) {
        clientToUse = client;
        break;
      }
    }
    
    if (!clientToUse) {
      return res.status(500).json({ error: 'No Discord bot connected' });
    }
    
    let member = null;
    for (const guild of clientToUse.guilds.cache.values()) {
      try {
        member = await guild.members.fetch(discordId);
        if (member) break;
      } catch (e) {}
    }

    if (!member) {
      const user = await clientToUse.users.fetch(discordId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        id: user.id,
        nickname: normalizeDiscordName(user.username),
        avatar: user.displayAvatarURL()
      });
    }
    
    res.json({
      id: member.id,
      nickname: normalizeDiscordName(member.displayName),
      avatar: member.user.displayAvatarURL()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
