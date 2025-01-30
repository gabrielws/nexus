import { Translations } from "./en"

const es: Translations = {
  common: {
    ok: "¡OK!",
    cancel: "Cancelar",
    back: "Volver",
    solve: "Resolver",
    reopen: "Reabrir",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar",
    send: "Enviar",
    retry: "Intentar de Nuevo",
    loading: "Cargando...",
    error: "Error",
  },
  welcomeScreen: {
    postscript:
      "psst  — This probably isn't what your app looks like. (Unless your designer handed you these screens, and in that case, ship it!)",
    readyForLaunch: "Your app, almost ready for launch!",
    exciting: "(ohh, this is exciting!)",
  },
  errorScreen: {
    title: "¡Algo salió mal!",
    friendlySubtitle:
      "Esta es la pantalla que verán tus usuarios en producción cuando ocurra un error. Querrás personalizar este mensaje (ubicado en `app/i18n/es.ts`) y probablemente también el diseño (`app/screens/ErrorScreen`). Si deseas eliminarlo por completo, revisa `app/app.tsx` para el componente <ErrorBoundary>.",
    reset: "REINICIAR APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "Tan vacío... tan triste",
      content:
        "Aún no se encontraron datos. Intenta hacer clic en el botón para actualizar o recargar la aplicación.",
      button: "Intentémoslo de nuevo",
    },
  },
  permissions: {
    title: "Permisos Necesarios",
    description: "Para usar todas las funciones de la aplicación, necesitamos algunos permisos:",
    allow: "Permitir",
    openSettings: "Configuración",
    location: {
      title: "Ubicación",
      description: "Necesario para mostrar tu posición en el mapa",
    },
    camera: {
      title: "Cámara",
      description: "Necesario para tomar fotos de problemas",
    },
    mediaLibrary: {
      title: "Galería",
      description: "Necesario para seleccionar fotos existentes",
    },
  },
  settings: {
    title: "Configuración",
    sections: {
      profile: {
        title: "PERFIL",
        editUser: "Editar Usuario",
        changePassword: "Cambiar Contraseña",
        changeEmail: "Cambiar Email",
      },
      notifications: {
        title: "NOTIFICACIONES",
        push: "Notificaciones Push",
        email: "Notificaciones por Email",
      },
      preferences: {
        title: "PREFERENCIAS",
        darkTheme: "Tema Oscuro",
        language: "Idioma",
      },
      about: {
        title: "ACERCA DE",
        version: "Versión de la App",
        terms: "Términos de Uso",
      },
      account: {
        title: "CERRAR SESIÓN",
        logout: "Cerrar Sesión",
      },
    },
  },
  language: {
    title: "Idioma",
    portuguese: "Portugués",
    english: "Inglés",
    spanish: "Español",
  },
  map: {
    title: "Mapa",
    report: {
      title: "Reportar Problema",
      form: {
        title: {
          label: "TÍTULO",
          placeholder: "Ej: Grifo roto",
          errors: {
            required: "El título es obligatorio",
            tooShort: "El título debe tener al menos 5 caracteres",
            tooLong: "El título debe tener como máximo 100 caracteres",
          },
        },
        description: {
          label: "DESCRIPCIÓN",
          placeholder: "Describe el problema en detalle",
          errors: {
            required: "La descripción es obligatoria",
            tooShort: "La descripción debe tener al menos 10 caracteres",
            tooLong: "La descripción debe tener como máximo 1000 caracteres",
          },
        },
        category: {
          label: "CATEGORÍA",
          errors: {
            required: "La categoría es obligatoria",
          },
        },
        photo: {
          label: "FOTO",
          errors: {
            required: "Una foto del problema es obligatoria",
            upload: "No se pudo subir la imagen. Por favor, inténtalo de nuevo.",
          },
        },
        location: {
          select: "Toca el mapa para seleccionar la ubicación del problema",
          errors: {
            invalid: "Ubicación inválida",
            longitude: "Ubicación inválida: longitud fuera de los límites",
            latitude: "Ubicación inválida: latitud fuera de los límites",
          },
        },
        submit: {
          button: "Reportar Problema",
          sending: "Enviando...",
          error: "Ocurrió un error al reportar el problema. Por favor, inténtalo de nuevo.",
          auth: "Debes iniciar sesión para reportar un problema",
        },
      },
    },
    problem: {
      status: {
        active: "Activo",
        solved: "Resuelto",
        invalid: "Inválido",
        deleted: "Eliminado",
      },
      details: {
        title: "Detalles del Problema",
        category: "Categoría",
        description: "Descripción",
        status: "Estado",
        reporter: "Reportado por",
        solver: "Resuelto por",
        date: {
          reported: "Reportado el",
          solved: "Resuelto el",
        },
        actions: {
          error: {
            selfSolve: "No puedes resolver tu propio problema",
          },
          solve: "Resolver Problema",
          reopen: "Reabrir Problema",
        },
        comments: {
          title: "Comentarios",
          input: {
            placeholder: "Escribe un comentario...",
          },
          empty: "Aún no hay comentarios",
        },
        image: {
          hint: "Toca para ampliar",
          loading: "Cargando imagen...",
          error: "Error al cargar la imagen",
        },
      },
    },
    categories: {
      infrastructure: "Infraestructura",
      maintenance: "Mantenimiento",
      security: "Seguridad",
      cleaning: "Limpieza",
      technology: "Tecnología",
      educational: "Educacional",
      social: "Social",
      sustainability: "Sostenibilidad",
    },
    offline: {
      title: "Sin conexión",
      message: "Verifica tu conexión a internet",
      retry: "Intentar de Nuevo",
    },
    history: {
      title: "Historial de Problemas Resueltos",
      empty: "Aún no hay problemas resueltos",
      solvedOn: "Resuelto el",
      unknownDate: "Fecha desconocida",
    },
  },
}

export default es
