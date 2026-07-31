import fs from 'fs';
import path from 'path';
import { queueUpload, queueDelete } from './gcsSync';

const DB_DIR = path.join(process.cwd(), 'db');
const OLD_DB_FILE = path.join(process.cwd(), 'db.json');

export interface LocalDbData {
  groups: {
    [groupID: string]: {
      members: string[];
      accounts?: {
        [username: string]: {
          password?: string;
          rule?: number;
          [key: string]: any;
        };
      };
      configs?: {
        discord?: {
          token?: string;
          guildId?: string;
          channelId?: string;
          channels?: Array<{ id: string; name: string }>;
          [key: string]: any;
        };
        [configKey: string]: any;
      };
      setups?: {
        [setupId: string]: {
          id: string;
          name: string;
          timestamp: number;
          creator?: string;
          [key: string]: any;
        };
      };
      polls?: {
        regular?: any;
        gvg?: any;
        [pollType: string]: any;
      };
      tactics?: {
        [tacticId: string]: {
          id: string;
          name: string;
          data: string; // JSON string of fabric canvas
          timestamp: number;
        }
      };
    };
  };
  members: {
    [memberId: string]: {
      id: string;
      name: string;
      avatar?: string;
      type?: number;
      [key: string]: any;
    };
  };
}

let cachedDb: LocalDbData | null = null;

function createDefaultDb(): LocalDbData {
  return {
    groups: {
      "1": { members: [], accounts: {}, configs: {}, setups: {}, polls: {}, tactics: {} },
      "2": { members: [], accounts: {}, configs: {}, setups: {}, polls: {}, tactics: {} }
    },
    members: {}
  };
}

function ensureDirExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function loadDb(): LocalDbData {
  if (cachedDb) return cachedDb;

  // Trường hợp 1: Thư mục db chưa tồn tại hoặc rỗng, nhưng db.json cũ tồn tại.
  // Chúng ta sẽ di chuyển dữ liệu từ db.json cũ sang thư mục db mới.
  if (!fs.existsSync(DB_DIR) && fs.existsSync(OLD_DB_FILE)) {
    try {
      console.log('[Database] Migrating from legacy db.json to directory structure...');
      const content = fs.readFileSync(OLD_DB_FILE, 'utf8');
      const oldData: LocalDbData = JSON.parse(content);
      
      // Ghi vào cấu trúc thư mục mới
      saveDb(oldData);
      
      // Đổi tên file db.json cũ sang db.json.bak để lưu trữ dự phòng và tránh chạy lại di chuyển này
      try {
        fs.renameSync(OLD_DB_FILE, OLD_DB_FILE + '.bak');
        console.log('[Database] Renamed legacy db.json to db.json.bak');
      } catch (renameErr) {
        console.error('[Database] Failed to rename db.json:', renameErr);
      }
      
      cachedDb = oldData;
      return cachedDb;
    } catch (error) {
      console.error('[Database] Failed to migrate from legacy db.json:', error);
    }
  }

  // Trường hợp 2: Thư mục db đã tồn tại, load dữ liệu từ các thư mục con lên.
  if (fs.existsSync(DB_DIR)) {
    try {
      const data: LocalDbData = {
        groups: {},
        members: {}
      };

      // 1. Đọc members
      const membersDir = path.join(DB_DIR, 'members');
      if (fs.existsSync(membersDir)) {
        const files = fs.readdirSync(membersDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const memberId = file.slice(0, -5);
            try {
              const content = fs.readFileSync(path.join(membersDir, file), 'utf8');
              data.members[memberId] = JSON.parse(content);
            } catch (err) {
              console.error(`[Database] Failed to read member file ${file}:`, err);
            }
          }
        }
      }

      // 2. Đọc groups (bao gồm cả members, accounts, configs, setups, polls, tactics của từng group)
      const groupsDir = path.join(DB_DIR, 'groups');
      const setupsBaseDir = path.join(DB_DIR, 'setups');
      const pollsBaseDir = path.join(DB_DIR, 'polls');
      const tacticsBaseDir = path.join(DB_DIR, 'tactics');

      // Danh sách các groupID có thể có
      let groupIDs: string[] = ['1', '2'];
      if (fs.existsSync(groupsDir)) {
        const subdirs = fs.readdirSync(groupsDir);
        for (const subdir of subdirs) {
          if (fs.statSync(path.join(groupsDir, subdir)).isDirectory()) {
            if (!groupIDs.includes(subdir)) {
              groupIDs.push(subdir);
            }
          }
        }
      }

      for (const groupID of groupIDs) {
        data.groups[groupID] = {
          members: [],
          accounts: {},
          configs: {},
          setups: {},
          polls: {},
          tactics: {}
        };

        const groupDir = path.join(groupsDir, groupID);
        if (fs.existsSync(groupDir)) {
          // Đọc members.json của group
          const membersFile = path.join(groupDir, 'members.json');
          if (fs.existsSync(membersFile)) {
            try {
              data.groups[groupID].members = JSON.parse(fs.readFileSync(membersFile, 'utf8'));
            } catch (err) {
              console.error(`[Database] Failed to read members.json for group ${groupID}:`, err);
            }
          }

          // Đọc accounts.json của group
          const accountsFile = path.join(groupDir, 'accounts.json');
          if (fs.existsSync(accountsFile)) {
            try {
              data.groups[groupID].accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
            } catch (err) {
              console.error(`[Database] Failed to read accounts.json for group ${groupID}:`, err);
            }
          }

          // Đọc configs.json của group
          const configsFile = path.join(groupDir, 'configs.json');
          if (fs.existsSync(configsFile)) {
            try {
              data.groups[groupID].configs = JSON.parse(fs.readFileSync(configsFile, 'utf8'));
            } catch (err) {
              console.error(`[Database] Failed to read configs.json for group ${groupID}:`, err);
            }
          }
        }

        // Đọc setups của group
        const setupsDir = path.join(setupsBaseDir, groupID);
        if (fs.existsSync(setupsDir)) {
          const files = fs.readdirSync(setupsDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const setupId = file.slice(0, -5);
              try {
                const content = fs.readFileSync(path.join(setupsDir, file), 'utf8');
                data.groups[groupID].setups![setupId] = JSON.parse(content);
              } catch (err) {
                console.error(`[Database] Failed to read setup file ${file} for group ${groupID}:`, err);
              }
            }
          }
        }

        // Đọc polls của group
        const pollsDir = path.join(pollsBaseDir, groupID);
        if (fs.existsSync(pollsDir)) {
          const files = fs.readdirSync(pollsDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const pollType = file.slice(0, -5);
              try {
                const content = fs.readFileSync(path.join(pollsDir, file), 'utf8');
                data.groups[groupID].polls![pollType] = JSON.parse(content);
              } catch (err) {
                console.error(`[Database] Failed to read poll file ${file} for group ${groupID}:`, err);
              }
            }
          }
        }

        // Đọc tactics của group
        const tacticsDir = path.join(tacticsBaseDir, groupID);
        if (fs.existsSync(tacticsDir)) {
          const files = fs.readdirSync(tacticsDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const tacticId = file.slice(0, -5);
              try {
                const content = fs.readFileSync(path.join(tacticsDir, file), 'utf8');
                data.groups[groupID].tactics![tacticId] = JSON.parse(content);
              } catch (err) {
                console.error(`[Database] Failed to read tactic file ${file} for group ${groupID}:`, err);
              }
            }
          }
        }
      }

      cachedDb = data;
      return cachedDb;
    } catch (error) {
      console.error('[Database] Failed to load database from directory structure, using default:', error);
    }
  }

  // Trường hợp 3: Chưa có bất cứ cái gì (thư mục db chưa có, db.json cũ cũng không có)
  cachedDb = createDefaultDb();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(data: LocalDbData) {
  cachedDb = data;
  try {
    ensureDirExists(DB_DIR);

    // 1. Lưu members
    const membersDir = path.join(DB_DIR, 'members');
    ensureDirExists(membersDir);
    
    // Đọc danh sách file hiện tại để xóa các file không còn tồn tại trong data.members
    const existingMemberFiles = fs.existsSync(membersDir) ? fs.readdirSync(membersDir) : [];
    const currentMemberIds = new Set(Object.keys(data.members || {}));
    
    for (const file of existingMemberFiles) {
      if (file.endsWith('.json')) {
        const id = file.slice(0, -5);
        if (!currentMemberIds.has(id)) {
          fs.unlinkSync(path.join(membersDir, file));
          queueDelete(`members/${file}`);
        }
      }
    }

    // Ghi từng member vào file
    for (const [id, member] of Object.entries(data.members || {})) {
      const memberPath = path.join(membersDir, `${id}.json`);
      fs.writeFileSync(memberPath, JSON.stringify(member, null, 2), 'utf8');
      queueUpload(`members/${id}.json`);
    }

    // 2. Lưu groups
    const groupsDir = path.join(DB_DIR, 'groups');
    const setupsBaseDir = path.join(DB_DIR, 'setups');
    const pollsBaseDir = path.join(DB_DIR, 'polls');
    const tacticsBaseDir = path.join(DB_DIR, 'tactics');

    ensureDirExists(groupsDir);
    ensureDirExists(setupsBaseDir);
    ensureDirExists(pollsBaseDir);
    ensureDirExists(tacticsBaseDir);

    // Ghi dữ liệu cho từng group
    for (const [groupID, group] of Object.entries(data.groups || {})) {
      const groupDir = path.join(groupsDir, groupID);
      ensureDirExists(groupDir);

      // Ghi members, accounts, configs của group
      fs.writeFileSync(path.join(groupDir, 'members.json'), JSON.stringify(group.members || [], null, 2), 'utf8');
      queueUpload(`groups/${groupID}/members.json`);
      fs.writeFileSync(path.join(groupDir, 'accounts.json'), JSON.stringify(group.accounts || {}, null, 2), 'utf8');
      queueUpload(`groups/${groupID}/accounts.json`);
      fs.writeFileSync(path.join(groupDir, 'configs.json'), JSON.stringify(group.configs || {}, null, 2), 'utf8');
      queueUpload(`groups/${groupID}/configs.json`);

      // Ghi setups của group
      const setupsDir = path.join(setupsBaseDir, groupID);
      ensureDirExists(setupsDir);
      const existingSetupFiles = fs.readdirSync(setupsDir);
      const currentSetupIds = new Set(Object.keys(group.setups || {}));
      
      for (const file of existingSetupFiles) {
        if (file.endsWith('.json')) {
          const id = file.slice(0, -5);
          if (!currentSetupIds.has(id)) {
            fs.unlinkSync(path.join(setupsDir, file));
            queueDelete(`setups/${groupID}/${file}`);
          }
        }
      }

      for (const [setupId, setup] of Object.entries(group.setups || {})) {
        fs.writeFileSync(path.join(setupsDir, `${setupId}.json`), JSON.stringify(setup, null, 2), 'utf8');
        queueUpload(`setups/${groupID}/${setupId}.json`);
      }

      // Ghi polls của group
      const pollsDir = path.join(pollsBaseDir, groupID);
      ensureDirExists(pollsDir);
      const existingPollFiles = fs.readdirSync(pollsDir);
      const currentPollTypes = new Set(Object.keys(group.polls || {}));

      for (const file of existingPollFiles) {
        if (file.endsWith('.json')) {
          const type = file.slice(0, -5);
          if (!currentPollTypes.has(type)) {
            fs.unlinkSync(path.join(pollsDir, file));
            queueDelete(`polls/${groupID}/${file}`);
          }
        }
      }

      for (const [pollType, poll] of Object.entries(group.polls || {})) {
        fs.writeFileSync(path.join(pollsDir, `${pollType}.json`), JSON.stringify(poll, null, 2), 'utf8');
        queueUpload(`polls/${groupID}/${pollType}.json`);
      }

      // Ghi tactics của group
      const tacticsDir = path.join(tacticsBaseDir, groupID);
      ensureDirExists(tacticsDir);
      const existingTacticFiles = fs.readdirSync(tacticsDir);
      const currentTacticIds = new Set(Object.keys(group.tactics || {}));

      for (const file of existingTacticFiles) {
        if (file.endsWith('.json')) {
          const id = file.slice(0, -5);
          if (!currentTacticIds.has(id)) {
            fs.unlinkSync(path.join(tacticsDir, file));
            queueDelete(`tactics/${groupID}/${file}`);
          }
        }
      }

      for (const [tacticId, tactic] of Object.entries(group.tactics || {})) {
        fs.writeFileSync(path.join(tacticsDir, `${tacticId}.json`), JSON.stringify(tactic, null, 2), 'utf8');
        queueUpload(`tactics/${groupID}/${tacticId}.json`);
      }
    }

  } catch (error) {
    console.error('Failed to write database to directory structure:', error);
  }
}


