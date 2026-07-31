import express from "express";
import { loadDb, saveDb } from './localDb';

const router = express.Router();

router.get("/setups/:groupID", async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const setups = (groupObj && groupObj.setups) ? Object.values(groupObj.setups) : [];
    
    const index = setups.map(setup => ({
      id: setup.id,
      name: setup.name,
      timestamp: setup.timestamp,
      creator: setup.creator || 'Unknown'
    }));
    
    res.json(index);
  } catch (error) {
    console.error("Error loading setups index:", error);
    res.status(500).json({ error: "Failed to load setups index" });
  }
});

router.get("/setups/:groupID/:id", async (req, res) => {
  try {
    const { groupID, id } = req.params;
    const localData = loadDb();
    const setup = localData.groups[groupID]?.setups?.[id];
    
    if (!setup) return res.status(404).json({ error: "Setup not found" });
    res.json(setup);
  } catch (error) {
    console.error("Error loading setup:", error);
    res.status(500).json({ error: "Failed to load setup" });
  }
});

router.post("/setups/:groupID", async (req, res) => {
  try {
    const { groupID } = req.params;
    const setup = req.body;
    if (!setup.id) {
      return res.status(400).json({ error: "Setup ID is required" });
    }
    
    const localData = loadDb();
    if (!localData.groups[groupID]) {
      localData.groups[groupID] = { members: [], accounts: {}, configs: {}, setups: {}, polls: {} };
    }
    if (!localData.groups[groupID].setups) {
      localData.groups[groupID].setups = {};
    }
    
    localData.groups[groupID].setups![setup.id] = setup;
    saveDb(localData);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving setup:", error);
    res.status(500).json({ error: "Failed to save setup" });
  }
});

router.delete("/setups/:groupID/:id", async (req, res) => {
  try {
    const { groupID, id } = req.params;
    const localData = loadDb();
    if (localData.groups[groupID]?.setups?.[id]) {
      delete localData.groups[groupID].setups![id];
      saveDb(localData);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting setup:", error);
    res.status(500).json({ error: "Failed to delete setup" });
  }
});

router.get('/members-config/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    res.json(localData.members || {});
  } catch (error) {
    res.json({});
  }
});

router.post('/members-config/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const configs = req.body;
    
    const localData = loadDb();
    for (const [id, config] of Object.entries(configs)) {
      if (!localData.members[id]) {
        localData.members[id] = { id, name: '' };
      }
      localData.members[id] = {
        ...localData.members[id],
        ...(config as any)
      };
    }
    saveDb(localData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save members config' });
  }
});

router.get('/custom-members/:groupID', async (req, res) => {
  try {
    const { groupID } = req.params;
    const localData = loadDb();
    const groupObj = localData.groups[groupID];
    const memberIds = groupObj?.members || [];
    
    if (memberIds.length === 0) return res.json([]);

    const groupMembers = Object.values(localData.members).filter(m => memberIds.includes(m.id));
    res.json(groupMembers);
  } catch (error) {
    console.error('Error fetching custom members:', error);
    res.json([]);
  }
});

router.delete('/custom-members/:groupID/:memberId', async (req, res) => {
  try {
    const { groupID, memberId } = req.params;
    const localData = loadDb();
    if (localData.groups[groupID]?.members) {
      localData.groups[groupID].members = localData.groups[groupID].members.filter(id => id !== memberId);
      saveDb(localData);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom member:', error);
    res.status(500).json({ error: 'Failed to delete custom member' });
  }
});

export default router;
