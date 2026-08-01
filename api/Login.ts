import express from "express";
import { decrypt } from './common';
import { loadDb, saveDb } from './localDb';
import { kiemMatKhau, bamMatKhau, taoPhien } from './auth';

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
    let canNangCap = false;

    for (const [groupID, groupObj] of Object.entries(localData.groups)) {
      if (groupObj.accounts && groupObj.accounts[username]) {
        const acc = groupObj.accounts[username];
        const kq = kiemMatKhau(password, acc.password);
        if (kq.dung) {
          foundGroup = groupID;
          foundAccount = acc;
          canNangCap = kq.canNangCap;
          break;
        }
      }
    }

    if (foundGroup && foundAccount) {
      // NÂNG CẤP NGAY khi đăng nhập đúng bằng mật khẩu còn để thô. Không thể băm hàng loạt
      // được vì băm là một chiều, không đọc ngược ra mật khẩu; chỉ có đúng lúc này mới cầm
      // được mật khẩu gốc trong tay. Mỗi người đăng nhập một lần là bản ghi của họ sạch.
      if (canNangCap) {
        localData.groups[foundGroup].accounts![username].password = bamMatKhau(password);
        saveDb(localData);
        console.log(`[login] Đã băm lại mật khẩu còn để thô của tài khoản "${username}".`);
      }

      res.json({
        success: true,
        groupID: foundGroup,
        username: username,
        rule: foundAccount.rule || 0,
        // Phiên CÓ KÝ. Từ đây máy chủ tự biết người gọi là ai và thuộc nhóm nào, không còn
        // phải tin những gì trình duyệt khai trong localStorage.
        token: taoPhien({ username, groupID: foundGroup, rule: foundAccount.rule || 0 }),
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
      rule: data.rule || 0,
      token: taoPhien({ username: data.nickname, groupID: data.groupID, rule: data.rule || 0 }),
    });
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
