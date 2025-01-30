import { Translations } from "./en"

const pt: Translations = {
  common: {
    ok: "OK!",
    cancel: "Cancelar",
    back: "Voltar",
    solve: "Resolver",
    reopen: "Reabrir",
    save: "Salvar",
    delete: "Deletar",
    edit: "Editar",
    close: "Fechar",
    send: "Enviar",
    retry: "Tentar Novamente",
    loading: "Carregando...",
    error: "Erro",
  },
  welcomeScreen: {
    postscript:
      "psst  — Este provavelmente não é o visual do seu app. (A menos que seu designer tenha entregue estas telas, e nesse caso, manda ver!)",
    readyForLaunch: "Seu app, quase pronto para o lançamento!",
    exciting: "(uau, isso é empolgante!)",
  },
  errorScreen: {
    title: "Algo deu errado!",
    friendlySubtitle:
      "Esta é a tela que seus usuários verão em produção quando ocorrer um erro. Você vai querer personalizar esta mensagem (localizada em `app/i18n/pt.ts`) e provavelmente o layout também (`app/screens/ErrorScreen`). Se você quiser removê-la por completo, verifique `app/app.tsx` para o componente <ErrorBoundary>.",
    reset: "REINICIAR APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "Tão vazio... tão triste",
      content:
        "Nenhum dado encontrado ainda. Tente clicar no botão para atualizar ou recarregar o aplicativo.",
      button: "Vamos tentar novamente",
    },
  },
  permissions: {
    title: "Permissões Necessárias",
    description: "Para usar todas as funcionalidades do app, precisamos de algumas permissões:",
    allow: "Permitir",
    openSettings: "Configurações",
    location: {
      title: "Localização",
      description: "Necessário para mostrar sua posição no mapa",
    },
    camera: {
      title: "Câmera",
      description: "Necessário para tirar fotos de problemas",
    },
    mediaLibrary: {
      title: "Galeria",
      description: "Necessário para selecionar fotos existentes",
    },
  },
  settings: {
    title: "Configurações",
    sections: {
      profile: {
        title: "PERFIL",
        editUser: "Editar Usuário",
        changePassword: "Alterar Senha",
        changeEmail: "Alterar Email",
      },
      notifications: {
        title: "NOTIFICAÇÕES",
        push: "Notificações Push",
        email: "Notificações por Email",
      },
      preferences: {
        title: "PREFERÊNCIAS",
        darkTheme: "Tema Escuro",
        language: "Idioma",
      },
      about: {
        title: "SOBRE",
        version: "Versão do App",
        terms: "Termos de Uso",
      },
      account: {
        title: "SAIR",
        logout: "Sair",
      },
    },
  },
  language: {
    title: "Idioma",
    portuguese: "Português",
    english: "Inglês",
    spanish: "Espanhol",
  },
  map: {
    title: "Mapa",
    report: {
      title: "Reportar Problema",
      form: {
        title: {
          label: "TÍTULO",
          placeholder: "Ex: Torneira quebrada",
          errors: {
            required: "O título é obrigatório",
            tooShort: "O título deve ter pelo menos 5 caracteres",
            tooLong: "O título deve ter no máximo 100 caracteres",
          },
        },
        description: {
          label: "DESCRIÇÃO",
          placeholder: "Descreva o problema em detalhes",
          errors: {
            required: "A descrição é obrigatória",
            tooShort: "A descrição deve ter pelo menos 10 caracteres",
            tooLong: "A descrição deve ter no máximo 1000 caracteres",
          },
        },
        category: {
          label: "CATEGORIA",
          errors: {
            required: "A categoria é obrigatória",
          },
        },
        photo: {
          label: "FOTO",
          errors: {
            required: "Uma foto do problema é obrigatória",
            upload: "Não foi possível enviar a imagem. Por favor, tente novamente.",
          },
        },
        location: {
          select: "Toque no mapa para selecionar a localização do problema",
          errors: {
            invalid: "Localização inválida",
            longitude: "Localização inválida: longitude fora dos limites",
            latitude: "Localização inválida: latitude fora dos limites",
          },
        },
        submit: {
          button: "Reportar Problema",
          sending: "Enviando...",
          error: "Ocorreu um erro ao reportar o problema. Por favor, tente novamente.",
          auth: "Você precisa fazer login para reportar um problema",
        },
      },
    },
    problem: {
      status: {
        active: "Ativo",
        solved: "Resolvido",
        invalid: "Inválido",
        deleted: "Deletado",
      },
      details: {
        title: "Detalhes do Problema",
        category: "Categoria",
        description: "Descrição",
        status: "Status",
        reporter: "Reportado por",
        solver: "Resolvido por",
        date: {
          reported: "Reportado em",
          solved: "Resolvido em",
        },
        actions: {
          error: {
            selfSolve: "Você não pode resolver seu próprio problema",
          },
          solve: "Resolver Problema",
          reopen: "Reabrir Problema",
        },
        comments: {
          title: "Comentários",
          input: {
            placeholder: "Escreva um comentário...",
          },
          empty: "Ainda não há comentários",
        },
        image: {
          hint: "Toque para ampliar",
          loading: "Carregando imagem...",
          error: "Erro ao carregar imagem",
        },
      },
    },
    categories: {
      infrastructure: "Infraestrutura",
      maintenance: "Manutenção",
      security: "Segurança",
      cleaning: "Limpeza",
      technology: "Tecnologia",
      educational: "Educacional",
      social: "Social",
      sustainability: "Sustentabilidade",
    },
    offline: {
      title: "Sem conexão",
      message: "Verifique sua conexão com a internet",
      retry: "Tentar Novamente",
    },
    history: {
      title: "Histórico de Problemas Resolvidos",
      empty: "Ainda não há problemas resolvidos",
      solvedOn: "Resolvido em",
      unknownDate: "Data desconhecida",
    },
  },
}

export default pt
