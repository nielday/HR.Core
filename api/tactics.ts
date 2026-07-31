import express from 'express';
import { loadDb, saveDb } from './localDb';

const router = express.Router();

router.get('/tactics/:groupId/:setupId', async (req, res) => {
  const { groupId, setupId } = req.params;
  try {
    const db = loadDb();
    const group = db.groups[groupId];
    if (!group || !group.tactics) return res.json({});
    
    const prefix = `${setupId}_`;
    const filteredTactics: any = {};
    for (const [key, value] of Object.entries(group.tactics)) {
      if (key.startsWith(prefix)) {
        const cleanKey = key.substring(prefix.length);
        filteredTactics[cleanKey] = {
          ...value,
          id: cleanKey
        };
      }
    }
    res.json(filteredTactics);
  } catch (error) {
    console.error('Failed to get tactics:', error);
    res.status(500).json({ error: 'Failed to fetch tactics' });
  }
});

router.post('/tactics/:groupId/:setupId', async (req, res) => {
  const { groupId, setupId } = req.params;
  const tactics = req.body;
  try {
    const db = loadDb();
    if (!db.groups[groupId]) {
      db.groups[groupId] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {}, tactics: {} };
    }
    if (!db.groups[groupId].tactics) {
      db.groups[groupId].tactics = {};
    }
    
    const group = db.groups[groupId];
    const prefix = `${setupId}_`;
    
    // Remove old tactics starting with this setupId
    for (const key of Object.keys(group.tactics)) {
      if (key.startsWith(prefix)) {
        delete group.tactics[key];
      }
    }
    
    // Save new tactics with the prefix
    for (const [key, value] of Object.entries(tactics)) {
      const prefixedKey = `${prefix}${key}`;
      group.tactics[prefixedKey] = {
        ...(value as any),
        id: prefixedKey
      };
    }
    
    saveDb(db);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save tactics:', error);
    res.status(500).json({ error: 'Failed to save tactics' });
  }
});

export default router;
