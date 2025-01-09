export const REWARDS_CONFIG = {
  CHECK_IN: {
    BASE_XP: 10, // Pontos base por check-in
    STREAK_MULTIPLIER: 0.1, // 10% extra por dia de streak
    HOURS_TO_RESET: 24, // 24 horas (mudado de milissegundos para horas)
  },
  LEVELS: [
    {
      level: 1,
      title: 'Iniciante',
      description: 'Começando sua jornada',
      xp_required: 0,
      rewards: ['Emblema de Iniciante', 'Acesso ao sistema de reportes'],
    },
    {
      level: 2,
      title: 'Observador',
      description: 'Seus olhos estão atentos',
      xp_required: 100,
      rewards: ['Emblema de Observador', 'Comentários em reportes'],
    },
    {
      level: 3,
      title: 'Cidadão Ativo',
      description: 'Participando ativamente',
      xp_required: 300,
      rewards: ['Emblema de Cidadão', 'Upvotes em reportes'],
    },
    {
      level: 4,
      title: 'Guardião da Cidade',
      description: 'Protegendo nossa comunidade',
      xp_required: 600,
      rewards: ['Emblema de Guardião', 'Resolução de problemas'],
    },
    {
      level: 5,
      title: 'Líder Comunitário',
      description: 'Inspirando outros a ajudar',
      xp_required: 1000,
      rewards: ['Emblema de Líder', 'Destaque no ranking'],
    },
    {
      level: 6,
      title: 'Agente de Mudança',
      description: 'Transformando a comunidade',
      xp_required: 1500,
      rewards: ['Emblema de Agente', 'Medalha de Dedicação'],
    },
    {
      level: 7,
      title: 'Herói Local',
      description: 'Fazendo a diferença',
      xp_required: 2100,
      rewards: ['Emblema de Herói', 'Perfil Destacado'],
    },
    {
      level: 8,
      title: 'Lenda da Cidade',
      description: 'Sua dedicação é inspiradora',
      xp_required: 2800,
      rewards: ['Emblema de Lenda', 'Conquistas Especiais'],
    },
    {
      level: 9,
      title: 'Mestre Guardião',
      description: 'Um exemplo a ser seguido',
      xp_required: 3600,
      rewards: ['Emblema de Mestre', 'Acesso a Recursos Avançados'],
    },
    {
      level: 10,
      title: 'Guardião Supremo',
      description: 'O mais alto nível de dedicação',
      xp_required: 4500,
      rewards: ['Emblema Supremo', 'Todas as Recompensas Desbloqueadas'],
    },
  ],
}
