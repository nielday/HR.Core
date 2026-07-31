import express from "express";
import { normalizeDiscordName, getDiscordClient, pollResultsCache, CACHE_TTL } from './common';
import { loadDb, saveDb } from './localDb';

const router = express.Router();

router.post('/poll/:groupID', async (req, res) => {
  const { groupID } = req.params;
  const client = await getDiscordClient(groupID);
  if (!client || !client.isReady()) {
    return res.status(400).json({ error: 'Bot is not connected' });
  }
  try {
    const { question, answers, allowMultiselect, duration, optionMappings, isGvg, channelId: bodyChannelId } = req.body;
    
    const localData = loadDb();
    const data = localData.groups[groupID]?.configs?.discord || {};
    // Ưu tiên kênh CHỮ dành riêng cho poll. Trước đây rơi thẳng về data.channelId, mà đó là
    // kênh VOICE (tool bắt buộc voice để lấy danh sách thành viên) -> poll chui vào khung
    // chat của kênh voice, báo thành công mà không ai thấy.
    const channelId = bodyChannelId || data.pollChannelId || data.channelId;
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      return res.status(400).json({ error: 'Channel does not support text messages' });
    }
    
    const pollQuestion = question || "Mọi người tiếp tục đánh hay nghỉ?";
    const pollAnswers = (answers && Array.isArray(answers) && answers.length > 0) 
      ? answers.map((a: string) => ({ text: a }))
      : [
          { text: "Tham gia" },
          { text: "Không tham gia" },
          { text: "Dự bị (Nhường slot, sẽ tham gia nếu thiếu người)" }
        ];

    const message = await (channel as any).send({
      poll: {
        question: { text: pollQuestion },
        answers: pollAnswers,
        allowMultiselect: allowMultiselect ?? false,
        duration: duration ?? 168
      }
    });
    
    const pollState = {
      messageId: message.id,
      channelId: message.channelId,
      guildId: message.guildId,
      createdAt: Date.now(),
      isGvg: isGvg || false,
      answers: pollAnswers.map((a: any) => a.text),
      optionMappings: optionMappings || {
        "Tham gia": 1,
        "Không tham gia": 0,
        "Dự bị (Nhường slot, sẽ tham gia nếu thiếu người)": 2
      }
    };
    
    const pollType = req.query.type === 'gvg' ? 'gvg' : 'regular';
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].polls) {
      localData.groups[groupID].polls = {};
    }
    localData.groups[groupID].polls![pollType] = pollState;
    saveDb(localData);
    
    const stateFile = req.query.type === 'gvg' ? `${groupID}/gvg-poll-state` : `${groupID}/poll-state`;
    delete pollResultsCache[stateFile];
    
    res.json(pollState);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/poll/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const pollType = req.query.type === 'gvg' ? 'gvg' : 'regular';
    const localData = loadDb();
    const poll = localData.groups[groupID]?.polls?.[pollType] || null;
    res.json(poll);
  } catch (error) {
    res.json(null);
  }
});

router.post('/poll/:groupID/close', async (req, res) => {
  const { groupID } = req.params;
  const pollType = req.query.type === 'gvg' ? 'gvg' : 'regular';
  const stateFile = req.query.type === 'gvg' ? `${groupID}/gvg-poll-state` : `${groupID}/poll-state`;
  const client = await getDiscordClient(groupID);
  if (!client || !client.isReady()) {
    return res.status(400).json({ error: 'Bot is not connected' });
  }
  try {
    const localData = loadDb();
    const pollState = localData.groups[groupID]?.polls?.[pollType] || null;
    
    if (pollState) {
      try {
        const channel = await client.channels.fetch(pollState.channelId);
        if (channel && channel.isTextBased()) {
          try {
            const message = await channel.messages.fetch(pollState.messageId);
            if (message && message.poll && !message.poll.resultsFinalized) {
              await message.poll.end();
            }
          } catch (msgError: any) {
            if (msgError.code === 10008) {
              console.warn('Poll message not found on Discord, proceeding to clear local state.');
            } else {
              throw msgError;
            }
          }
        }
      } catch (discordError) {
        console.error('Error ending poll on Discord:', discordError);
      }
      
      if (req.query.type === 'gvg') {
        if (localData.groups[groupID] && localData.groups[groupID].polls && localData.groups[groupID].polls![pollType]) {
          localData.groups[groupID].polls![pollType].isClosed = true;
        }
      } else {
        if (localData.groups[groupID] && localData.groups[groupID].polls) {
          delete localData.groups[groupID].polls![pollType];
        }
      }
      saveDb(localData);
      
      delete pollResultsCache[stateFile];
    }
    res.json({ success: true });
  } catch (error: any) {
    if (req.query.type !== 'gvg') {
      const localData = loadDb();
      if (localData.groups[groupID] && localData.groups[groupID].polls) {
        delete localData.groups[groupID].polls![pollType];
        saveDb(localData);
      }
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/poll/results/:groupID', async (req, res) => {
  const { groupID } = req.params;
  const pollType = req.query.type === 'gvg' ? 'gvg' : 'regular';
  const stateFile = req.query.type === 'gvg' ? `${groupID}/gvg-poll-state` : `${groupID}/poll-state`;
  const client = await getDiscordClient(groupID);
  if (!client || !client.isReady()) {
    return res.status(400).json({ error: 'Bot is not connected' });
  }

  if (pollResultsCache[stateFile] && Date.now() - pollResultsCache[stateFile].timestamp < CACHE_TTL) {
    return res.json(pollResultsCache[stateFile].data);
  }

  try {
    const localData = loadDb();
    const pollState = localData.groups[groupID]?.polls?.[pollType] || null;
    
    if (!pollState) {
      return res.status(400).json({ error: 'Poll not found' });
    }
    
    const channel = await client.channels.fetch(pollState.channelId);
    if (!channel || !channel.isTextBased()) {
      return res.status(400).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(pollState.messageId);
    if (!message || !message.poll) {
      return res.status(400).json({ error: 'Poll not found' });
    }
    
    const results: any = {
      continue: [] as any[],
      backup: [] as any[],
      options: [] as { text: string, users: any[] }[]
    };
    
    if (pollState.isGvg) {
      results.options = (pollState.answers || []).map((text: string) => ({
        text,
        users: [] as any[]
      }));
      
      for (const [answerId, answer] of message.poll.answers) {
        const text = answer.text;
        const voters = await answer.voters.fetch();
        const userObjects = voters.map(v => ({
          id: v.id,
          name: normalizeDiscordName(v.displayName || v.username),
          avatar: v.displayAvatarURL()
        }));
        
        const optIndex = results.options.findIndex((opt: any) => opt.text === text);
        if (optIndex !== -1) {
          results.options[optIndex].users = userObjects;
        } else {
          results.options.push({ text, users: userObjects });
        }
      }
    } else {
      for (const [answerId, answer] of message.poll.answers) {
        const text = answer.text;
        const voters = await answer.voters.fetch();
        const userObjects = voters.map(v => ({
          id: v.id,
          name: normalizeDiscordName(v.displayName || v.username),
          avatar: v.displayAvatarURL()
        }));

        const mapping = pollState.optionMappings?.[text];
        if (mapping === 1) {
          results.continue.push(...userObjects);
        } else if (mapping === 2) {
          results.backup.push(...userObjects);
        }
      }
    }
    
    pollResultsCache[stateFile] = { data: results, timestamp: Date.now() };
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/discord/message/:groupID', async (req, res) => {
  const { groupID } = req.params;
  const { message, channelId: bodyChannelId } = req.body;

  const client = await getDiscordClient(groupID);
  if (!client || !client.isReady()) {
    return res.status(400).json({ error: 'Bot is not connected' });
  }

  try {
    const localData = loadDb();
    const data = localData.groups[groupID]?.configs?.discord || {};
    // Ưu tiên kênh CHỮ dành riêng cho poll. Trước đây rơi thẳng về data.channelId, mà đó là
    // kênh VOICE (tool bắt buộc voice để lấy danh sách thành viên) -> poll chui vào khung
    // chat của kênh voice, báo thành công mà không ai thấy.
    const channelId = bodyChannelId || data.pollChannelId || data.channelId;
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      return res.status(400).json({ error: 'Channel does not support text messages' });
    }

    await (channel as any).send(message);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
