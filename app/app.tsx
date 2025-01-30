/* eslint-disable react-native/no-inline-styles */
/* eslint-disable import/first */
if (__DEV__) {
  require("./devtools/ReactotronConfig.ts")
}

import "./utils/gestureHandler"
import "./utils/ignoreWarnings"

import { useEffect, useState } from "react"
import { initI18n } from "./i18n"
import * as SplashScreen from "expo-splash-screen"
import { useFonts } from "expo-font"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"
import * as Linking from "expo-linking"
import { useInitialRootStore } from "./models"
import { AppNavigator, useNavigationPersistence } from "./navigators"
import { ErrorBoundary } from "./screens/ErrorScreen/ErrorBoundary"
import * as storage from "./utils/storage"
import { customFontsToLoad } from "./theme"
import Config from "./config"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { loadDateFnsLocale } from "./utils/formatDate"
import { AuthProvider } from "./services/auth/useAuth"
import { Loading } from "./components"
import { useRealtimeSubscriptions } from "./utils/useRealtimeSubscriptions"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { usePermissions } from "@/utils/usePermissions"
import { PermissionsModal } from "@/components/PermissionsModal"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Impede que a Splash do Expo feche automaticamente
SplashScreen.preventAutoHideAsync().catch(() => {})

// Web linking configuration
const prefix = Linking.createURL("/")
const config = {
  screens: {
    Login: {
      path: "",
    },
    Welcome: "welcome",
    Demo: {
      screens: {
        DemoShowroom: {
          path: "showroom/:queryIndex?/:itemIndex?",
        },
        DemoDebug: "debug",
        DemoPodcastList: "podcast",
        DemoCommunity: "community",
      },
    },
  },
}

/**
 * This is the root component of our app.
 * @param {AppProps} props - The props for the `App` component.
 * @returns {JSX.Element} The rendered `App` component.
 */
export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)
  const { rehydrated } = useInitialRootStore(() => {
    // Log de sucesso na inicialização
    console.log("✅ RootStore inicializado com sucesso")
  })
  const [appIsReady, setAppIsReady] = useState(false)

  const { status, isChecking, checkPermissions, openSettings } = usePermissions()

  useEffect(() => {
    async function prepare() {
      try {
        console.log("🔄 Iniciando preparação do app...")
        await initI18n()
        setIsI18nInitialized(true)
        await loadDateFnsLocale()
        console.log("✅ App preparado com sucesso")
      } catch (e) {
        console.error("❌ Erro ao preparar app:", e)
      } finally {
        setAppIsReady(true)
      }
    }
    prepare()
  }, [])

  // Efeito separado para verificar permissões
  useEffect(() => {
    if (appIsReady) {
      checkPermissions()
    }
  }, [appIsReady])

  // Efeito para esconder a splash screen
  useEffect(() => {
    if (appIsReady && !isChecking) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [appIsReady, isChecking])

  const isLoadingSomething =
    !rehydrated ||
    !isNavigationStateRestored ||
    !isI18nInitialized ||
    (!areFontsLoaded && !fontLoadError) ||
    !appIsReady ||
    isChecking

  // Se estiver carregando recursos básicos, mostra loading
  if (isLoadingSomething) {
    return <Loading />
  }

  // Se não tem todas as permissões, mostra modal
  if (!status.allGranted) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PermissionsModal
            visible={true}
            locationStatus={status.location}
            cameraStatus={status.camera}
            mediaLibraryStatus={status.mediaLibrary}
            onRequestPermission={async (_type) => {
              // Mostra loading enquanto verifica permissões
              setAppIsReady(false)
              await checkPermissions()
              setAppIsReady(true)
            }}
            onOpenSettings={openSettings}
          />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    )
  }

  const linking = {
    prefixes: [prefix],
    config,
  }

  // Só renderiza o app se tiver todas as permissões
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RealtimeProvider>
          <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <ErrorBoundary catchErrors={Config.catchErrors}>
              <KeyboardProvider>
                <AppNavigator
                  linking={linking}
                  initialState={initialNavigationState}
                  onStateChange={onNavigationStateChange}
                />
              </KeyboardProvider>
            </ErrorBoundary>
          </SafeAreaProvider>
        </RealtimeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

// Componente para gerenciar as subscrições realtime
function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSubscriptions()
  return <>{children}</>
}
