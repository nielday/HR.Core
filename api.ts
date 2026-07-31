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

export const app = express();

app.use(express.json({ limit: '50mb' }));

// Register routers
app.use('/api', loginRouter);
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
