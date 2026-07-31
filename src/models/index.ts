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
  // Discord ID thật, tách khỏi `id`. Người thêm tay lúc bot chưa tra ra được mang
  // id 'custom_<thời điểm>' và giữ nguyên id đó mãi, nên `id` không dùng để gọi Discord.
  discordId?: string;
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
  /** Kênh voice người này đang ngồi, chỉ có khi lấy từ nguồn voice. */
  voiceChannelId?: string;
  voiceChannelName?: string;
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

/** Kênh voice đọc thẳng từ Discord, kèm số người đang ngồi trong đó. */
export type VoiceChannel = {
  id: string;
  name: string;
  thuMuc?: string;
  soNguoi: number;
};

/** Nguồn danh sách theo voice: kênh nào đang tick, và kênh nào ứng với khu nào. */
export type VoiceNguon = {
  /** id các kênh voice đang lấy người. */
  chon: string[];
  /** kênh voice -> id khu, để nút "Xếp theo voice" biết thả ai vào đâu. */
  gan: Record<string, string>;
};

export type DiscordConfig = {
  token: string;
  guildId: string;
  /** Kênh VOICE — nguồn danh sách thành viên (ai đang ngồi trong đó). */
  channelId: string;
  /** Kênh CHỮ để đăng poll. Không đặt thì rơi về channelId, và poll sẽ nằm trong khung
   *  chat của kênh voice — đúng về kỹ thuật nhưng không ai vào đó xem. */
  pollChannelId?: string;
  channels?: DiscordChannel[];
  voiceNguon?: VoiceNguon;
};
