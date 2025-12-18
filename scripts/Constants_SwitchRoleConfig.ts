import { Role } from "Enums_Game";

export interface RoleEntry {
  id: Role;
  name: string;
  icon: string; // texture asset id (fallback – resolved to actual Asset via props)
}

export const ROLE_CONFIG: RoleEntry[] = [
  { id: "Fetcher", name: "Fetcher", icon: "icon_fetcher" },
  { id: "Scooper", name: "Scooper", icon: "icon_scooper" },
  { id: "Server", name: "Server", icon: "icon_server" },
];

/**
 * Maximum concurrent players per role.
 * Adjust these numbers to balance your game.
 */
export const ROLE_MAX_PLAYERS: Record<Role, number> = {
  Fetcher: 5,
  Scooper: 5,
  Server: 5,
};

export const ButtonStates = {
  SELECTED: {
    roleTextColor: "rgba(0,0,0,0.4)",
    imageOpacity: 1,
    buttonImageColor: "rgba(111,255,156,1)",
    btnText: "Selected",
    btnTextColor: "rgba(58, 57, 57, 1)",
    cardBgColor: "rgba(111,255,156,1)",
  },
  Available: {
    roleTextColor: "black",
    imageOpacity: 1,
    buttonImageColor: "rgba(39,110,43,1)",
    btnText: "SELECT",
    btnTextColor: "white",
    cardBgColor: "white",
  },
  Unavailable: {
    roleTextColor: "rgba(0,0,0,0.4)",
    imageOpacity: 0.35,
    buttonImageColor: "rgba(255, 255, 255, 1)",
    btnText: "FULL",
    btnTextColor: "rgba(58, 57, 57, 0.73)",
    cardBgColor: "white",
  },
  Switch: {
    roleTextColor: "black",
    imageOpacity: 1,
    buttonImageColor: "rgba(39,110,43,1)",
    btnText: "SWITCH",
    btnTextColor: "white",
    cardBgColor: "white",
  },
  DEFAULT: {
    roleTextColor: "black",
    imageOpacity: 1,
    buttonImageColor: "rgba(39,110,43,1)",
    btnText: "SELECT",
    btnTextColor: "white",
    cardBgColor: "white",
  },
};
