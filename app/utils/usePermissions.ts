import { useState } from "react"
import * as Location from "expo-location"
import * as ImagePicker from "expo-image-picker"
import { Platform, Linking } from "react-native"

export interface PermissionStatus {
  location: boolean
  camera: boolean
  mediaLibrary: boolean
  allGranted: boolean
  error?: string
}

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>({
    location: false,
    camera: false,
    mediaLibrary: false,
    allGranted: false,
  })
  const [isChecking, setIsChecking] = useState(true)

  const checkPermissions = async () => {
    try {
      setIsChecking(true)

      // Verifica permissão de localização
      const locationStatus = await Location.requestForegroundPermissionsAsync()

      // Verifica permissão de câmera
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync()

      // Verifica permissão de galeria
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync()

      const newStatus = {
        location: locationStatus.status === "granted",
        camera: cameraStatus.status === "granted",
        mediaLibrary: mediaLibraryStatus.status === "granted",
        allGranted: false,
      }

      // Verifica se todas as permissões foram concedidas
      newStatus.allGranted = newStatus.location && newStatus.camera && newStatus.mediaLibrary

      setStatus(newStatus)
      return newStatus
    } catch (error) {
      console.error("Erro ao verificar permissões:", error)
      setStatus((prev) => ({ ...prev, error: String(error) }))
      return null
    } finally {
      setIsChecking(false)
    }
  }

  // Função para abrir configurações
  const openSettings = async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:")
    } else {
      await Linking.openSettings()
    }
  }

  return {
    status,
    isChecking,
    checkPermissions,
    openSettings,
  }
}
