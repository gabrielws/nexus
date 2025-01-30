export const REWARDS_CONFIG = {
  CHECK_IN: {
    BASE_XP: 30,
    STREAK_MULTIPLIER: 2, // 2 XP por dia de streak
    HOURS_BETWEEN_CHECKINS: 24, // Intervalo entre check-ins
    HOURS_TO_RESET: 48, // 48h para perder a streak
  },
  LEVELS: [
    {
      level: 1,
      title: "Iniciante",
      description: "Começando sua jornada",
      xp_required: 0,
    },
    {
      level: 2,
      title: "Observador",
      description: "Seus olhos estão atentos",
      xp_required: 100,
    },
    {
      level: 3,
      title: "Cidadão Ativo",
      description: "Participando ativamente",
      xp_required: 300,
    },
    {
      level: 4,
      title: "Guardião da Cidade",
      description: "Protegendo nossa comunidade",
      xp_required: 600,
    },
    {
      level: 5,
      title: "Líder Comunitário",
      description: "Inspirando outros a ajudar",
      xp_required: 1000,
    },
    {
      level: 6,
      title: "Agente de Mudança",
      description: "Transformando a comunidade",
      xp_required: 1500,
    },
    {
      level: 7,
      title: "Herói Local",
      description: "Fazendo a diferença",
      xp_required: 2100,
    },
    {
      level: 8,
      title: "Lenda da Cidade",
      description: "Sua dedicação é inspiradora",
      xp_required: 2800,
    },
    {
      level: 9,
      title: "Mestre Guardião",
      description: "Um exemplo a ser seguido",
      xp_required: 3600,
    },
    {
      level: 10,
      title: "Guardião Supremo",
      description: "O mais alto nível de dedicação",
      xp_required: 4500,
    },
  ],
}
