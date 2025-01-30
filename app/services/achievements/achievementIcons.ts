// Mapeamento de ícones de conquistas
export const achievementIconRegistry: Record<string, any> = {
  selo: require("./icons/selo.png"),
  alert: require("./icons/alert.png"),
  sino: require("./icons/sino.png"),
  fogo: require("./icons/fogo.png"),
  camera: require("./icons/camera.png"),
  engrenagem: require("./icons/engrenagem.png"),
  medalha: require("./icons/medalha.png"),
  calendario: require("./icons/calendario.png"),
  distintivo: require("./icons/distintivo.png"),
  upvote1: require("./icons/upvote1.png"),
  upvote2: require("./icons/upvote2.png"),
  upvote3: require("./icons/upvote3.png"),
  cracha: require("./icons/cracha.png"),
  diamante: require("./icons/diamante.png"),
  diamante2: require("./icons/diamante2.png"),
  level3: require("./icons/level3.png"),
  level5: require("./icons/level5.png"),
}

// Tipo para as chaves do registro de ícones
export type AchievementIconTypes = keyof typeof achievementIconRegistry
