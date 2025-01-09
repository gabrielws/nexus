import React from 'react'
import { Alert } from 'react-native'
import { Button, Screen, Text } from '@/components'
import * as ExpoLocation from 'expo-location'
import * as IntentLauncher from 'expo-intent-launcher'
import { useStores } from '@/models'
import { observer } from 'mobx-react-lite'

export const PermissionScreen = observer(() => {
  const { locationStore } = useStores()

  const requestPermission = async () => {
    const { status: existingStatus } = await ExpoLocation.getForegroundPermissionsAsync()

    if (existingStatus === 'denied') {
      Alert.alert(
        'Permissão necessária',
        'Para continuar, você precisa permitir o acesso à localização nas configurações do seu dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir Configurações',
            onPress: () => IntentLauncher.startActivityAsync(
              IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
            ),
          },
        ],
      )
      return
    }

    const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
    const granted = status === 'granted'
    locationStore.setLocationPermission(granted)
  }

  return (
    <Screen style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text
        text="Para continuar, precisamos de acesso à sua localização exata."
        preset="subheading"
        style={{ marginBottom: 20 }}
      />
      <Button
        preset="filled"
        text="Permitir Localização"
        onPress={requestPermission}
      />
    </Screen>
  )
})
