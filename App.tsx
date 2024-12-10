import App from '@/app'
import * as SplashScreen from 'expo-splash-screen'
import '@expo/metro-runtime'

SplashScreen.preventAutoHideAsync()

function IgniteApp() {
  return <App hideSplashScreen={SplashScreen.hideAsync} />
}

export default IgniteApp
