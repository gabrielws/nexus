const palette = {
  neutral100: "#FFFFFF",
  neutral200: "#F4F2F1",
  neutral300: "#D7CEC9",
  neutral400: "#B6ACA6",
  neutral500: "#978F8A",
  neutral600: "#564E4A",
  neutral700: "#3C3836",
  neutral800: "#191015",
  neutral900: "#000000",

  primary100: "#F4E0D9",
  primary200: "#E8C1B4",
  primary300: "#DDA28E",
  primary400: "#D28468",
  primary500: "#C76542",
  primary600: "#A54F31",

  secondary100: "#DCDDE9",
  secondary200: "#BCC0D6",
  secondary300: "#9196B9",
  secondary400: "#626894",
  secondary500: "#41476E",

  accent100: "#FFEED4",
  accent200: "#FFE1B2",
  accent300: "#FDD495",
  accent400: "#FBC878",
  accent500: "#FFBB50",

  angry100: "#F2D6CD",
  angry500: "#C03403",

  // Colors

  colorA1: "#11998E",
  colorA2: "#38EF7D",

  colorB1: "#FC4A1A",
  colorB2: "#F7B733",

  colorD1: "#89216B",
  colorD2: "#89216B",

  colorC1: "#5B86E5",
  colorC2: "#36D1DC",

  colorE1: "#4E54C8",
  colorE2: "#8F94FB",

  colorF1: "#38F9D7",
  colorF2: "#43E97B",

  colorG1: "#C471F5",
  colorG2: "#FA71CD",

  overlay20: "rgba(25, 16, 21, 0.2)",
  overlay50: "rgba(25, 16, 21, 0.5)",
} as const

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The default text color in many components.
   */
  text: palette.neutral800,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral100,
  /**
   * The default border color.
   */
  border: palette.neutral400,
  /**
   * The main tinting color.
   */
  tint: palette.primary500,
  /**
   * The inactive tinting color.
   */
  tintInactive: palette.neutral300,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral300,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   */
  errorBackground: palette.angry100,
  colorA1: palette.colorA1,
  colorA2: palette.colorA2,
  colorB1: palette.colorB1,
  colorB2: palette.colorB2,
  colorC1: palette.colorC1,
  colorC2: palette.colorC2,
  colorD1: palette.colorD1,
  colorD2: palette.colorD2,
  colorE1: palette.colorE1,
  colorE2: palette.colorE2,
  colorF1: palette.colorF1,
  colorF2: palette.colorF2,
  colorG1: palette.colorG1,
  colorG2: palette.colorG2,
} as const
