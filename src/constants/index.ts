import { Rank, Weapon, Role, Area, WeaponCategory } from '../models';

export const RANKS: Record<string, Rank> = {
  RECRUIT: { id: 'rank1', name: 'ranks.recruit', color: '#949BA4', borderColor: '#4F545C' },
  SOLDIER: { id: 'rank2', name: 'ranks.soldier', color: '#2ecc71', borderColor: '#27ae60' },
  VETERAN: { id: 'rank3', name: 'ranks.veteran', color: '#3498db', borderColor: '#2980b9' },
  ELITE: { id: 'rank4', name: 'ranks.elite', color: '#f1c40f', borderColor: '#f39c12' },
};

export const WEAPONS: Record<string, Weapon> = {
  STRATEGIC_SWORD: { id: 'w1', name: 'weapons.strategicSword', icon: '/assets/weapons/Strategic Sword.svg', category: 'tank' },
  NAMELESS_SWORD: { id: 'w2', name: 'weapons.namelessSword', icon: '/assets/weapons/Nameless Sword.svg', category: 'tank' },
  INFERNAL_TWINBLADES: { id: 'w3', name: 'weapons.infernalTwinblades', icon: '/assets/weapons/Infernal Twinblades.svg', category: 'melee' },
  HEAVENQUAKER_SPEAR: { id: 'w4', name: 'weapons.heavenquakerSpear', icon: '/assets/weapons/Heavenquaker Spear.svg', category: 'tank' },
  NAMELESS_SPEAR: { id: 'w5', name: 'weapons.namelessSpear', icon: '/assets/weapons/Nameless Spear.svg', category: 'tank' },
  STORMBREAKER_SPEAR: { id: 'w6', name: 'weapons.stormbreakerSpear', icon: '/assets/weapons/Stormbreaker Spear.svg', category: 'tank' },
  THUNDERCRY_BLADE: { id: 'w7', name: 'weapons.thundercryBlade', icon: '/assets/weapons/Thundercry Blade.svg', category: 'melee' },
  MORTAL_ROPE_DART: { id: 'w8', name: 'weapons.mortalRopeDart', icon: '/assets/weapons/Mortal Rope Dart.svg', category: 'ranger' },
  VERNAL_UMBRELLA: { id: 'w9', name: 'weapons.vernalUmbrella', icon: '/assets/weapons/Vernal Umbrella.svg', category: 'heal' },
  SOULSHADE_UMBRELLA: { id: 'w10', name: 'weapons.soulshadeUmbrella', icon: '/assets/weapons/Soulshade Umbrella.svg', category: 'heal' },
  PANACEA_FAN: { id: 'w11', name: 'weapons.panaceaFan', icon: '/assets/weapons/Panacea Fan.svg', category: 'heal' },
  INKWELL_FAN: { id: 'w12', name: 'weapons.inkwellFan', icon: '/assets/weapons/Inkwell Fan.svg', category: 'heal' },
  SNOWPARTING_BLADE : { id: 'w13', name: 'weapons.snowpartingBlade', icon: '/assets/weapons/Snowparting Blade.svg', category: 'tank' },
  EVERSPRING_UMBRELLA : { id: 'w14', name: 'weapons.everspringUmbrella', icon: '/assets/weapons/Everspring Umbrella.svg', category: 'ranger' },
  PHALANXBANE_BLADE : { id: 'w15', name: 'weapons.phalanxbaneBlade', icon: '/assets/weapons/Phalanxbane Blade.svg', category: 'melee' },
  UNFETTERED_ROPE_DART: { id: 'w16', name: 'weapons.unfetteredRopeDart', icon: '/assets/weapons/Unfettered Rope Dart.svg', category: 'melee' },
  NONE: { id: 'w0', name: 'weapons.none', icon: '', category: 'none' },
};

export const ROLES: Record<string, Role> = {
  TANK: { id: 'r1', name: 'roles.tank', color: '#b35a00', icon: '🛡️', weapons: [WEAPONS.STRATEGIC_SWORD, WEAPONS.NAMELESS_SWORD, WEAPONS.HEAVENQUAKER_SPEAR, WEAPONS.NAMELESS_SPEAR, WEAPONS.STORMBREAKER_SPEAR] },
  DPS: { id: 'r2', name: 'roles.dps', color: '#2471a3', icon: '⚔️', weapons: [WEAPONS.INFERNAL_TWINBLADES, WEAPONS.THUNDERCRY_BLADE, WEAPONS.MORTAL_ROPE_DART] },
  SUPPORT: { id: 'r3', name: 'roles.heal', color: '#2d7d46', icon: '💖', weapons: [WEAPONS.VERNAL_UMBRELLA, WEAPONS.SOULSHADE_UMBRELLA, WEAPONS.PANACEA_FAN, WEAPONS.INKWELL_FAN] },
  CONTROL: { id: 'r4', name: 'roles.control', color: '#f1c40f', icon: '⛓️', weapons: [WEAPONS.MORTAL_ROPE_DART, WEAPONS.THUNDERCRY_BLADE] },
  FLEX: { id: 'r5', name: 'roles.flex', color: '#9b59b6', icon: '🔀', weapons: [] },
  IGL: { id: 'r6', name: 'roles.igl', color: '#e67e22', icon: '👑', weapons: [] },
};

export const CATEGORY_LABELS: Record<WeaponCategory, { name: string, color: string, icon: string }> = {
  melee: { name: 'categories.melee', color: '#2471a3', icon: '⚔️' },
  ranger: { name: 'categories.ranger', color: '#f1c40f', icon: '🏹' },
  heal: { name: 'categories.heal', color: '#2d7d46', icon: '💖' },
  tank: { name: 'categories.tank', color: '#b35a00', icon: '🛡️' },
  none: { name: 'categories.none', color: '#949BA4', icon: '❓' }
};

export const ROLE_OPTIONS = [
  { id: 'tank', name: 'roles.tank', icon: '🛡️', color: '#b35a00' },
  { id: 'dps', name: 'roles.dps', icon: '⚔️', color: '#2471a3' },
  { id: 'heal', name: 'roles.heal', icon: '💖', color: '#2d7d46' },
  { id: 'flex', name: 'roles.flex', icon: '🔀', color: '#9b59b6' },
];

export const POSITION_OPTIONS = [
  { id: 'pos_cong', name: 'positions.attack', icon: '⚔️', color: '#2471a3' },
  { id: 'pos_thu', name: 'positions.defense', icon: '🛡️', color: '#b35a00' },
  { id: 'pos_flex', name: 'positions.flex', icon: '🔀', color: '#9b59b6' },
];

export const defaultReqs = {};
