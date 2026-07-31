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
    const { token, guildId, channelId, channels } = req.body;
    
    const encryptedToken = encrypt(token || '');
    
    const localData = loadDb();
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].configs) {
      localData.groups[groupID].configs = {};
    }
    
    localData.groups[groupID].configs!.discord = { 
      token: encryptedToken, 
      guildId, 
      channelId,
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

    const connectionResult = new Promise<{ success: boolean; error?: string }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Kết nối quá hạn (Timeout). Hãy kiểm tra Token và Internet.' });
      }, 30000);

      newClient.once('ready', async () => {
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

          const channel = await guild.channels.fetch(data.channelId).catch(err => {
            console.error(`Failed to fetch channel ${data.channelId}:`, err);
            return null;
          });

          if (channel && channel.isVoiceBased()) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: `Không tìm thấy kênh voice (Channel ID: ${data.channelId}) hoặc Bot không có quyền truy cập.` });
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
        res.json({ success: true });
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
