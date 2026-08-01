import express from "express";
import { autoConnectBots } from './api/common';
import loginRouter from './api/Login';
import discordConfigRouter from './api/DiscordConfigModal';
import setupManagementRouter from './api/SetupManagement';
import addMemberModalRouter from './api/AddMemberModal';
import memberUpdateRouter from './api/MemberUpdate';
import unassignedSidebarRouter from './api/UnassignedSidebar';
import matchResultModalRouter from './api/MatchResultModal';
import tacticsRouter from './api/tactics';
import postLineupRouter from './api/PostLineup';
import { batBuocDangNhap } from './api/auth';

export const app = express();

app.use(express.json({ limit: '50mb' }));

// Đăng nhập phải đứng TRƯỚC chốt chặn, vì chính nó là chỗ phát phiên.
app.use('/api', loginRouter);

// CHỐT CHẶN. Mọi thứ đăng ký sau dòng này đều phải có phiên hợp lệ, trừ vài đường công khai
// được liệt kê trong auth.ts. Đặt ở đây chứ không rắc từng route: quên gắn vào một route là
// route đó hở, mà hở thì không ai thấy cho tới lúc có người khai thác.
app.use('/api', batBuocDangNhap);

app.use('/api', discordConfigRouter);
app.use('/api', setupManagementRouter);
app.use('/api', addMemberModalRouter);
app.use('/api', memberUpdateRouter);
app.use('/api', unassignedSidebarRouter);
app.use('/api', matchResultModalRouter);
app.use('/api', tacticsRouter);
app.use('/api', postLineupRouter);

// Auto-connect bots on startup
async function initBots() {
  try {
    await autoConnectBots();
  } catch (err) {
    console.error('Failed to auto-connect bots:', err);
  }
}
setTimeout(initBots, 2000);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});
