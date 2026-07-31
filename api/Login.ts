import express from "express";
import { decrypt } from './common';
import { loadDb } from './localDb';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const localData = loadDb();
    let foundGroup: string | null = null;
    let foundAccount: any = null;

    for (const [groupID, groupObj] of Object.entries(localData.groups)) {
      if (groupObj.accounts && groupObj.accounts[username]) {
        const acc = groupObj.accounts[username];
        if (acc.password === password) {
          foundGroup = groupID;
          foundAccount = acc;
          break;
        }
      }
    }
    
    if (foundGroup && foundAccount) {
      res.json({ 
        success: true, 
        groupID: foundGroup, 
        username: username,
        rule: foundAccount.rule || 0
      });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.post('/discord-auth', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decrypted = decrypt(token);
    const data = JSON.parse(decrypted);
    
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    res.json({ 
      success: true, 
      groupID: data.groupID, 
      username: data.nickname,
      rule: data.rule || 0
    });
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
