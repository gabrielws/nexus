const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    solve: "Solve",
    reopen: "Reopen",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    send: "Send",
    retry: "Try Again",
    loading: "Loading...",
    error: "Error",
  },
  welcomeScreen: {
    postscript:
      "psst  — This probably isn't what your app looks like. (Unless your designer handed you these screens, and in that case, ship it!)",
    readyForLaunch: "Your app, almost ready for launch!",
    exciting: "(ohh, this is exciting!)",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen that your users will see in production when an error is thrown. You'll want to customize this message (located in `app/i18n/en.ts`) and probably the layout as well (`app/screens/ErrorScreen`). If you want to remove this entirely, check `app/app.tsx` for the <ErrorBoundary> component.",
    reset: "RESET APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },
  permissions: {
    title: "Required Permissions",
    description: "To use all app features, we need some permissions:",
    allow: "Allow",
    openSettings: "Settings",
    location: {
      title: "Location",
      description: "Required to show your position on the map",
    },
    camera: {
      title: "Camera",
      description: "Required to take photos of problems",
    },
    mediaLibrary: {
      title: "Gallery",
      description: "Required to select existing photos",
    },
  },
  settings: {
    title: "Settings",
    sections: {
      profile: {
        title: "PROFILE",
        editUser: "Edit User",
        changePassword: "Change Password",
        changeEmail: "Change Email",
      },
      notifications: {
        title: "NOTIFICATIONS",
        push: "Push Notifications",
        email: "Email Notifications",
      },
      preferences: {
        title: "PREFERENCES",
        darkTheme: "Dark Theme",
        language: "Language",
      },
      about: {
        title: "ABOUT",
        version: "App Version",
        terms: "Terms of Use",
      },
      account: {
        title: "SIGN OUT",
        logout: "Sign Out",
      },
    },
  },
  language: {
    title: "Language",
    portuguese: "Portuguese",
    english: "English",
    spanish: "Spanish",
  },
  map: {
    title: "Map",
    report: {
      title: "Report Problem",
      form: {
        title: {
          label: "TITLE",
          placeholder: "Ex: Broken faucet",
          errors: {
            required: "Title is required",
            tooShort: "Title must be at least 5 characters long",
            tooLong: "Title must be at most 100 characters long",
          },
        },
        description: {
          label: "DESCRIPTION",
          placeholder: "Describe the problem in detail",
          errors: {
            required: "Description is required",
            tooShort: "Description must be at least 10 characters long",
            tooLong: "Description must be at most 1000 characters long",
          },
        },
        category: {
          label: "CATEGORY",
          errors: {
            required: "Category is required",
          },
        },
        photo: {
          label: "PHOTO",
          errors: {
            required: "A photo of the problem is required",
            upload: "Could not upload image. Please try again.",
          },
        },
        location: {
          select: "Tap on the map to select the problem location",
          errors: {
            invalid: "Invalid location",
            longitude: "Invalid location: longitude out of bounds",
            latitude: "Invalid location: latitude out of bounds",
          },
        },
        submit: {
          button: "Report Problem",
          sending: "Sending...",
          error: "An error occurred while reporting the problem. Please try again.",
          auth: "You need to be logged in to report a problem",
        },
      },
    },
    problem: {
      status: {
        active: "Active",
        solved: "Solved",
        invalid: "Invalid",
        deleted: "Deleted",
      },
      details: {
        title: "Problem Details",
        category: "Category",
        description: "Description",
        status: "Status",
        reporter: "Reported by",
        solver: "Solved by",
        date: {
          reported: "Reported on",
          solved: "Solved on",
        },
        actions: {
          solve: "Solve Problem",
          reopen: "Reopen Problem",
          error: {
            selfSolve: "You cannot solve your own problem",
          },
        },
        comments: {
          title: "Comments",
          input: {
            placeholder: "Add a comment...",
          },
          empty: "No comments yet",
        },
        image: {
          hint: "Tap to zoom",
          loading: "Loading image...",
          error: "Error loading image",
        },
      },
    },
    categories: {
      infrastructure: "Infrastructure",
      maintenance: "Maintenance",
      security: "Security",
      cleaning: "Cleaning",
      technology: "Technology",
      educational: "Educational",
      social: "Social",
      sustainability: "Sustainability",
    },
    offline: {
      title: "Offline",
      message: "Check your internet connection",
      retry: "Try Again",
    },
    history: {
      title: "Solved Problems History",
      empty: "No problems solved yet",
      solvedOn: "Solved on",
      unknownDate: "Unknown date",
    },
  },
}

export default en
export type Translations = typeof en
