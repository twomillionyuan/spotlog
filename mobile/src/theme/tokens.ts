import { Platform } from "react-native";

export const theme = {
  colors: {
    background: "#FBF5FF",
    backgroundMuted: "#F0E5FA",
    text: "#312547",
    subtleText: "#61557B",
    mutedText: "#8D82A8",
    accent: "#8D69D8",
    surface: "#FFF9FF",
    surfaceMuted: "#F1E9FA",
    border: "#DDD0F0",
    cardAccent: "#9B78E6",
    mapSurface: "#DEE8FF",
    danger: "#C55D88",
    shadow: "rgba(78, 61, 117, 0.14)"
  },
  fonts: {
    serif: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "Georgia"
    }),
    sans: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: "system-ui"
    })
  }
} as const;

export const statCardPalette = [
  {
    backgroundColor: "#FBE7F2",
    borderColor: "#EDC7DC",
    accentColor: "#D87FA9"
  },
  {
    backgroundColor: "#F3EAFE",
    borderColor: "#DDCBF8",
    accentColor: "#A47AE7"
  },
  {
    backgroundColor: "#E9F1FF",
    borderColor: "#C9D8F7",
    accentColor: "#7C9EE7"
  },
  {
    backgroundColor: "#EFE7FF",
    borderColor: "#D8C9F5",
    accentColor: "#9579D9"
  }
] as const;

export const urgencyCardPalette = {
  low: {
    background: "#E9F1FF",
    border: "#C9D8F7"
  },
  medium: {
    background: "#EFE7FF",
    border: "#D8C9F5"
  },
  high: {
    background: "#F4E7FB",
    border: "#E0C8F0"
  },
  critical: {
    background: "#FBE7F2",
    border: "#EDC7DC"
  }
} as const;

export const listColorPalette = [
  "#DCC8F5",
  "#F0CFE3",
  "#CFE0FF",
  "#E3D3F8",
  "#D9E6FF"
] as const;
