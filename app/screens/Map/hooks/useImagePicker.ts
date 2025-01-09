/* eslint-disable no-alert */
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

export function useImagePicker() {
  const [problemImage, setProblemImage] = useState<string>('')
  const [imageError, setImageError] = useState(false)

  const handleSelectPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      alert('É necessário permissão para acessar a galeria')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled) {
      setProblemImage(result.assets[0].uri)
      setImageError(false)
    }
  }

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

    if (permissionResult.granted === false) {
      alert('É necessário permissão para acessar a câmera')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })

    if (!result.canceled) {
      setProblemImage(result.assets[0].uri)
      setImageError(false)
    }
  }

  return {
    problemImage,
    imageError,
    setProblemImage,
    setImageError,
    handleSelectPhoto,
    handleTakePhoto,
  }
}
