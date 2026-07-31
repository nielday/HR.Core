export type WeaponCategory = 'melee' | 'ranger' | 'heal' | 'tank' | 'none';

export type Weapon = {
  id: string;
  name: string;
  icon: string;
  category: WeaponCategory;
};

export type Role = {
  id: string;
  name: string;
  color: string;
  icon: string;
  weapons: Weapon[];
};

export type Rank = {
  id: string;
  name: string;
  color: string;
  borderColor: string;
};

export type MatchResult = {
  Win: number;
  Lose: number;
};

export type MatchResultStats = {
  League: MatchResult;
  Rated: MatchResult;
  Scrim: MatchResult;
};

export type MemberStats = {
  leagueMatches: number;
  ratedMatches: number;
  confirmedMatches: number;
};

export type Member = {
  id: string;
  name: string;
  avatar: string;
  ingameName?: string;
  ingameId?: string;
  role: string;
  position?: string;
  primaryWeapon1: Weapon;
  primaryWeapon2: Weapon;
  secondaryWeapons: Weapon[];
  stats?: MemberStats;
  matchStats?: MatchResultStats;
  rank: Rank;
  isConfirmed?: boolean;
  status?: 'online' | 'offline' | 'in-game';
  registration?: 'match1' | 'match2' | 'none';
  participationStatus?: 'confirmed' | 'backup';
  note?: string;
  source?: 'discord' | 'custom';
  type?: number;
};

export type Team = {
  id: string;
  name: string;
  members: Member[];
  requirements: Record<string, number>;
  isLocked?: boolean;
};

export type Area = {
  id: string;
  name: string;
  teams: Team[];
  isLocked?: boolean;
};

export type SetupMetadata = {
  id: string;
  name: string;
  timestamp: number;
  creator: string;
};

export type SavedSetup = {
  id: string;
  name: string;
  areas: Area[];
  unassignedMembers: Member[];
  timestamp: number;
  memberSource?: 'discord' | 'custom';
  creator?: string;
};

export type DiscordChannel = {
  id: string;
  name: string;
};

export type DiscordConfig = {
  token: string;
  guildId: string;
  channelId: string;
  channels?: DiscordChannel[];
};
