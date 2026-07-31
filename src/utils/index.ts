import { Member, Role, Weapon, Team, Area } from '../models';
import { ROLES, WEAPONS, RANKS, defaultReqs, ROLE_OPTIONS } from '../constants';

export function normalizeDiscordName(str: string): string {
  if (!str) return '';
  
  let normalized = str.normalize('NFKD');
  
  const mathMap: Record<string, string> = {
    '𝗔': 'A', '𝗕': 'B', '𝗖': 'C', '𝗗': 'D', '𝗘': 'E', '𝗙': 'F', '𝗚': 'G', '𝗛': 'H', '𝗜': 'I', '𝗝': 'J', '𝗞': 'K', '𝗟': 'L', '𝗠': 'M', '𝗡': 'N', '𝗢': 'O', '𝗣': 'P', '𝗤': 'Q', '𝗥': 'R', '𝗦': 'S', '𝗧': 'T', '𝗨': 'U', '𝗩': 'V', '𝗪': 'W', '𝗫': 'X', '𝗬': 'Y', '𝗭': 'Z',
    '𝗮': 'a', '𝗯': 'b', '𝗰': 'c', '𝗱': 'd', '𝗲': 'e', '𝗳': 'f', '𝗴': 'g', '𝗵': 'h', '𝗶': 'i', '𝗷': 'j', '𝗸': 'k', '𝗹': 'l', '𝗺': 'm', '𝗻': 'n', '𝗼': 'o', '𝗽': 'p', '𝗾': 'q', '𝗿': 'r', '𝘀': 's', '𝘁': 't', '𝘂': 'u', '𝘃': 'v', '𝘄': 'w', '𝘅': 'x', '𝘆': 'y', '𝘇': 'z',
    '𝘈': 'A', '𝘉': 'B', '𝘊': 'C', '𝘋': 'D', '𝘌': 'E', '𝘍': 'F', '𝘎': 'G', '𝘏': 'H', '𝘐': 'I', '𝘑': 'J', '𝘒': 'K', '𝘓': 'L', '𝘔': 'M', '𝘕': 'N', '𝘖': 'O', '𝘗': 'P', '𝘘': 'Q', '𝘙': 'R', '𝘚': 'S', '𝘛': 'T', '𝘜': 'U', '𝘝': 'V', '𝘞': 'W', '𝘟': 'X', '𝘠': 'Y', '𝘡': 'Z',
    '𝘢': 'a', '𝘣': 'b', '𝘤': 'c', '𝘥': 'd', '𝘦': 'e', '𝘧': 'f', '𝘨': 'g', '𝘩': 'h', '𝘪': 'i', '𝘫': 'j', '𝘬': 'k', '𝘭': 'l', '𝘮': 'm', '𝘯': 'n', '𝘰': 'o', '𝘱': 'p', '𝘲': 'q', '𝘳': 'r', '𝘴': 's', '𝘵': 't', '𝘶': 'u', '𝘷': 'v', '𝘸': 'w', '𝘹': 'x', '𝘺': 'y', '𝘻': 'z',
    '𝘼': 'A', '𝘽': 'B', '𝘾': 'C', '𝘿': 'D', '𝙀': 'E', '𝙁': 'F', '𝙂': 'G', '𝙃': 'H', '𝙄': 'I', '𝙅': 'J', '𝙆': 'K', '𝙇': 'L', '𝙈': 'M', '𝙉': 'N', '𝙊': 'O', '𝙋': 'P', '𝙌': 'Q', '𝙍': 'R', '𝙎': 'S', '𝙏': 'T', '𝙐': 'U', '𝙑': 'V', '𝙒': 'W', '𝙓': 'X', '𝙔': 'Y', '𝙕': 'Z',
    '𝙖': 'a', '𝙗': 'b', '𝙘': 'c', '𝙙': 'd', '𝙚': 'e', '𝙛': 'f', '𝙜': 'g', '𝙝': 'h', '𝙞': 'i', '𝙟': 'j', '𝙠': 'k', '𝙡': 'l', '𝙢': 'm', '𝙣': 'n', '𝙤': 'o', '𝙥': 'p', '𝙦': 'q', '𝙧': 'r', '𝙨': 's', '𝙩': 't', '𝙪': 'u', '𝙫': 'v', '𝙬': 'w', '𝙭': 'x', '𝙮': 'y', '𝙯': 'z',
    '𝒜': 'A', 'ℬ': 'B', '𝒞': 'C', '𝒟': 'D', 'ℰ': 'E', 'ℱ': 'F', '𝒢': 'G', 'ℋ': 'H', 'ℐ': 'I', '𝒥': 'J', '𝒦': 'K', 'ℒ': 'L', 'ℳ': 'M', '𝒩': 'N', '𝒪': 'O', '𝒫': 'P', '𝒬': 'Q', 'ℛ': 'R', '𝒮': 'S', '𝒯': 'T', '𝒰': 'U', '𝒱': 'V', '𝒲': 'W', '𝒳': 'X', '𝒴': 'Y', '𝒵': 'Z',
    '𝒶': 'a', '𝒷': 'b', '𝒸': 'c', '𝒹': 'd', 'ℯ': 'e', '𝒻': 'f', 'ℊ': 'g', '𝒽': 'h', '𝒾': 'i', '𝒿': 'j', '𝓀': 'k', '𝓁': 'l', '𝓂': 'm', '𝓃': 'n', 'ℴ': 'o', '𝓅': 'p', '𝓆': 'q', '𝓇': 'r', '𝓈': 's', '𝓉': 't', '𝓊': 'u', '𝓋': 'v', '𝓌': 'w', '𝓍': 'x', '𝓎': 'y', '𝓏': 'z',
    '𝓐': 'A', '𝓑': 'B', '𝓒': 'C', '𝓓': 'D', '𝓔': 'E', '𝓕': 'F', '𝓖': 'G', '𝓗': 'H', '𝓘': 'I', '𝓙': 'J', '𝓚': 'K', '𝓛': 'L', '𝓜': 'M', '𝓝': 'N', '𝓞': 'O', '𝓟': 'P', '𝓠': 'Q', '𝓡': 'R', '𝓢': 'S', '𝓣': 'T', '𝓤': 'U', '𝓥': 'V', '𝓦': 'W', '𝓧': 'X', '𝓨': 'Y', '𝓩': 'Z',
    '𝓪': 'a', '𝓫': 'b', '𝓬': 'c', '𝓭': 'd', '𝓮': 'e', '𝓯': 'f', '𝓰': 'g', '𝓱': 'h', '𝓲': 'i', '𝓳': 'j', '𝓴': 'k', '𝓵': 'l', '𝓶': 'm', '𝓷': 'n', '𝓸': 'o', '𝓹': 'p', '𝓺': 'q', '𝓻': 'r', '𝓼': 's', '𝓽': 't', '𝓾': 'u', '𝓿': 'v', '𝔀': 'w', '𝔁': 'x', '𝔂': 'y', '𝔃': 'z',
    '𝔄': 'A', '𝔅': 'B', 'ℭ': 'C', '𝔇': 'D', '𝔈': 'E', '𝔉': 'F', '𝔊': 'G', 'ℌ': 'H', 'ℑ': 'I', '𝔍': 'J', '𝔎': 'K', '𝔏': 'L', '𝔐': 'M', '𝔑': 'N', '𝔒': 'O', '𝔓': 'P', '𝔔': 'Q', 'ℜ': 'R', '𝔖': 'S', '𝔗': 'T', '𝔘': 'U', '𝔙': 'V', '𝔚': 'W', '𝔛': 'X', '𝔜': 'Y', 'ℨ': 'Z',
    '𝔞': 'a', '𝔟': 'b', '𝔠': 'c', '𝔡': 'd', '𝔢': 'e', '𝔣': 'f', '𝔤': 'g', '𝔥': 'h', '𝔦': 'i', '𝔧': 'j', '𝔨': 'k', '𝔩': 'l', '𝔪': 'm', '𝔫': 'n', '𝔬': 'o', '𝔭': 'p', '𝔮': 'q', '𝔯': 'r', '𝔰': 's', '𝔱': 't', '𝔲': 'u', '𝔳': 'v', '𝔴': 'w', '𝔵': 'x', '𝔶': 'y', '𝔷': 'z',
    '𝕬': 'A', '𝕭': 'B', '𝕮': 'C', '𝕯': 'D', '𝕰': 'E', '𝕱': 'F', '𝕲': 'G', '𝕳': 'H', '𝕴': 'I', '𝕵': 'J', '𝕶': 'K', '𝕷': 'L', '𝕸': 'M', '𝕹': 'N', '𝕺': 'O', '𝕻': 'P', '𝕼': 'Q', '𝕽': 'R', '𝕾': 'S', '𝕿': 'T', '𝖀': 'U', '𝖁': 'V', '𝖂': 'W', '𝖃': 'X', '𝖄': 'Y', '𝖅': 'Z',
    '𝖆': 'a', '𝖇': 'b', '𝖈': 'c', '𝖉': 'd', '𝖊': 'e', '𝖋': 'f', '𝖌': 'g', '𝖍': 'h', '𝖎': 'i', '𝖏': 'j', '𝖐': 'k', '𝖑': 'l', '𝖒': 'm', '𝖓': 'n', '𝖔': 'o', '𝖕': 'p', '𝖖': 'q', '𝖗': 'r', '𝖘': 's', '𝖙': 't', '𝖚': 'u', '𝖛': 'v', '𝖜': 'w', '𝖝': 'x', '𝖞': 'y', '𝖟': 'z',
    '𝔸': 'A', '𝔹': 'B', 'ℂ': 'C', '𝔻': 'D', '𝔼': 'E', '𝔽': 'F', '𝔾': 'G', 'ℍ': 'H', '𝕀': 'I', '𝕁': 'J', '𝕂': 'K', '𝕃': 'L', '𝕄': 'M', 'ℕ': 'N', '𝕆': 'O', 'ℙ': 'P', 'ℚ': 'Q', 'ℝ': 'R', '𝕊': 'S', '𝕋': 'T', '𝕌': 'U', '𝕍': 'V', '𝕎': 'W', '𝕏': 'X', '𝕐': 'Y', 'ℤ': 'Z',
    '𝕒': 'a', '𝕓': 'b', '𝕔': 'c', '𝕕': 'd', '𝕖': 'e', '𝕗': 'f', '𝕘': 'g', '𝕙': 'h', '𝕚': 'i', '𝕛': 'j', '𝕜': 'k', '𝕝': 'l', '𝕞': 'm', '𝕟': 'n', '𝕠': 'o', '𝕡': 'p', '𝕢': 'q', '𝕣': 'r', '𝕤': 's', '𝕥': 't', '𝕦': 'u', '𝕧': 'v', '𝕨': 'w', '𝕩': 'x', '𝕪': 'y', '𝕫': 'z',
    '𝙰': 'A', '𝙱': 'B', '𝙲': 'C', '𝙳': 'D', '𝙴': 'E', '𝙵': 'F', '𝙶': 'G', '𝙷': 'H', '𝙸': 'I', '𝙹': 'J', '𝙺': 'K', '𝙻': 'L', '𝙼': 'M', '𝙽': 'N', '𝙾': 'O', '𝙿': 'P', '𝚀': 'Q', '𝚁': 'R', '𝚂': 'S', '𝚃': 'T', '𝚄': 'U', '𝚅': 'V', '𝚆': 'W', '𝚇': 'X', '𝚈': 'Y', '𝚉': 'Z',
    '𝚊': 'a', '𝚋': 'b', '𝚌': 'c', '𝚍': 'd', '𝚎': 'e', '𝚏': 'f', '𝚐': 'g', '𝚑': 'h', '𝚒': 'i', '𝚓': 'j', '𝚔': 'k', '𝚕': 'l', '𝚖': 'm', '𝚗': 'n', '𝚘': 'o', '𝚙': 'p', '𝚚': 'q', '𝚛': 'r', '𝚜': 's', '𝚝': 't', '𝚞': 'u', '𝚟': 'v', '𝚠': 'w', '𝚡': 'x', '𝚢': 'y', '𝚣': 'z',
    'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E', 'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H', 'Ｉ': 'I', 'Ｊ': 'J', 'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O', 'Ｐ': 'P', 'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T', 'Ｕ': 'U', 'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X', 'Ｙ': 'Y', 'Ｚ': 'Z',
    'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e', 'ｆ': 'f', 'ｇ': 'g', 'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j', 'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o', 'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't', 'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x', 'ｙ': 'y', 'ｚ': 'z',
  };

  let result = '';
  for (const char of normalized) {
    result += mathMap[char] || char;
  }
  
  return result;
}

export const getRoleStats = (members: Member[]) => {
  const stats: Record<string, { count: number; color: string }> = {};
  members.forEach(m => {
    const predefinedRole = m.role ? (ROLE_OPTIONS.find(r => r.id === m.role) || Object.values(ROLES).find(r => r.id === m.role) || ROLES[m.role.toUpperCase()]) : null;
    const roleName = predefinedRole ? predefinedRole.name : (m.role || 'Chưa chọn');
    if (!stats[roleName]) {
      stats[roleName] = { count: 0, color: predefinedRole ? predefinedRole.color : '#949BA4' };
    }
    stats[roleName].count += 1;
  });
  return stats;
};

export const getWeaponStats = (members: Member[]) => {
  const primary: Record<string, { weapon: Weapon, count: number }> = {};
  const secondary: Record<string, { weapon: Weapon, count: number }> = {};
  
  members.forEach(m => {
    if (m.primaryWeapon1) {
      if (!primary[m.primaryWeapon1.id]) {
        primary[m.primaryWeapon1.id] = { weapon: m.primaryWeapon1, count: 0 };
      }
      primary[m.primaryWeapon1.id].count += 1;
    }
    if (m.primaryWeapon2) {
      if (!primary[m.primaryWeapon2.id]) {
        primary[m.primaryWeapon2.id] = { weapon: m.primaryWeapon2, count: 0 };
      }
      primary[m.primaryWeapon2.id].count += 1;
    }
    m.secondaryWeapons.forEach(sw => {
      if (!secondary[sw.id]) {
        secondary[sw.id] = { weapon: sw, count: 0 };
      }
      secondary[sw.id].count += 1;
    });
  });
  return { primary, secondary };
};

export const hasMissingRequirements = (members: Member[], requirements?: Record<string, number>) => {
  if (!requirements) return false;
  const { primary, secondary } = getWeaponStats(members);
  
  return Object.entries(requirements).some(([id, requiredCount]) => {
    if (requiredCount <= 0) return false;
    
    // Check if it's a weapon ID
    if (id.startsWith('w')) {
      const currentCount = (primary[id]?.count || 0) + (secondary[id]?.count || 0);
      return requiredCount > currentCount;
    }
    
    // Check if it's a rank ID
    if (id.startsWith('rank')) {
      const currentCount = members.filter(m => m.rank.id === id).length;
      return requiredCount > currentCount;
    }

    // Check if it's a role ID (tank, dps, heal, flex)
    const roleIds = ['tank', 'dps', 'heal', 'flex'];
    if (roleIds.includes(id)) {
      const currentCount = members.filter(m => {
        const mRole = ROLE_OPTIONS.find(r => r.id === m.role) || Object.values(ROLES).find(r => r.id === m.role) || ROLES[m.role.toUpperCase()];
        return mRole?.id === id;
      }).length;
      return requiredCount > currentCount;
    }

    // Check if it's a position ID (pos_cong, pos_thu, pos_flex or legacy công, thủ, flex)
    const positionIds = ['pos_cong', 'pos_thu', 'pos_flex', 'công', 'thủ', 'flex'];
    if (positionIds.includes(id)) {
      const currentCount = members.filter(m => {
        const mPos = m.position?.toLowerCase();
        if (id === 'pos_cong' || id === 'công') return mPos === 'công' || mPos === 'pos_cong';
        if (id === 'pos_thu' || id === 'thủ') return mPos === 'thủ' || mPos === 'pos_thu';
        if (id === 'pos_flex' || id === 'flex') return mPos === 'flex' || mPos === 'pos_flex';
        return false;
      }).length;
      return requiredCount > currentCount;
    }
    
    return false;
  });
};

export const areaHasMissingRequirements = (teams: Team[]) => {
  return teams.some(team => hasMissingRequirements(team.members, team.requirements));
};

export const hasOfflineMembers = (members: Member[]) => {
  return members.some(m => m.status === 'offline');
};

export const areaHasOfflineMembers = (teams: Team[]) => {
  return teams.some(team => hasOfflineMembers(team.members));
};

export * from './diemDanhVoice';

export const isTowerArea = (name: string) => name.toLowerCase().includes('trụ') || name.toLowerCase().includes('tower');
export const isPVPArea = (name: string) => name.toLowerCase().includes('pvp');

export const initialUnassigned: Member[] = [];

export const getTranslatedAreas = (t: any): Area[] => [
  {
    id: 'a0',
    name: t('defaultAreas.pvp'),
    isLocked: true,
    teams: [
      { id: 't0', name: t('defaultAreas.teamPvp'), members: [], requirements: { ...defaultReqs }, isLocked: false },
    ]
  },
  {
    id: 'a1',
    name: t('defaultAreas.towerTeam'),
    isLocked: true,
    teams: [
      { id: 't1', name: t('defaultAreas.bottom'), members: [], requirements: { ...defaultReqs }, isLocked: false },
      { id: 't2', name: t('defaultAreas.middle'), members: [], requirements: { ...defaultReqs }, isLocked: false },
      { id: 't3', name: t('defaultAreas.top'), members: [], requirements: { ...defaultReqs }, isLocked: false },
    ]
  },
  {
    id: 'a2',
    name: t('defaultAreas.attackTeam'),
    teams: [
      { id: 't4', name: t('defaultAreas.attack1'), members: [], requirements: { ...defaultReqs } },
      { id: 't5', name: t('defaultAreas.attack2'), members: [], requirements: { ...defaultReqs } },
      { id: 't6', name: t('defaultAreas.attack3'), members: [], requirements: { ...defaultReqs } },
    ]
  },
  {
    id: 'a3',
    name: t('defaultAreas.defendTeam'),
    teams: [
      { id: 't7', name: t('defaultAreas.defend1'), members: [], requirements: { ...defaultReqs } },
      { id: 't8', name: t('defaultAreas.defend2'), members: [], requirements: { ...defaultReqs } },
      { id: 't9', name: t('defaultAreas.defend3'), members: [], requirements: { ...defaultReqs } },
    ]
  }
];
