import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Alert, type ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import { Screen, Text } from '@/components'
import MapboxGL from '@rnmapbox/maps'
import { useEffect } from 'react'
import * as ExpoLocation from 'expo-location'
import { MaterialIcons } from '@expo/vector-icons'

interface MapScreenProps extends AppStackScreenProps<'Map'> {}

MapboxGL.setAccessToken('pk.eyJ1IjoidWVlZ2FicmllbCIsImEiOiJjbTJ3cnM3c3AwOXZlMmpxMndyZHBoMWRmIn0.1SvRf9_dODBqIK2iPrfceg')
MapboxGL.setTelemetryEnabled(false)

export const MapScreen: FC<MapScreenProps> = observer(() => {
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          MapboxGL.locationManager.start()
        }
        else {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à sua localização para mostrar no mapa')
        }
      }
      catch (error) {
        console.error('Erro ao solicitar permissões:', error)
      }
    }

    requestPermissions()

    return (): void => {
      MapboxGL.locationManager.stop()
    }
  }, [])

  return (
    <Screen
      contentContainerStyle={$contentContainer}
    >
      <MapboxGL.MapView
        styleURL="mapbox://styles/mapbox/standard-satellite"
        style={$mapStyle}
        logoEnabled={false}
        surfaceView={false}
        pitchEnabled
        rotateEnabled
        attributionEnabled={false}

      >
        <MapboxGL.VectorSource
          id="source"
          url="mapbox://ueegabriel.cm56bc04u3g1l1oo1hqsb02hl-1nnk7"
        >
          <MapboxGL.FillExtrusionLayer
            id="buildings"
            sourceLayerID="IF"
            minZoomLevel={15}
            maxZoomLevel={22}
            style={{
              fillExtrusionColor: '#fff',
              fillExtrusionOpacity: 0.4,
              fillExtrusionHeight: 0, // altura em metros
              fillExtrusionBase: 0, // altura da base
            }}
          />
          {/* <MapboxGL.SymbolLayer
            id="building-labels"
            sourceLayerID="IF"
            style={{
              iconImage: 'restaurant-menu',
              iconSize: 1,
              iconAllowOverlap: true,
              textField: ['get', 'name'],
              textSize: 12,
              textColor: 'orange',
            }}
          /> */}
        </MapboxGL.VectorSource>

        <MapboxGL.Camera
          followZoomLevel={18}
          zoomLevel={18}
          followPitch={50}
          followUserLocation
        />
        <MapboxGL.UserLocation />

      </MapboxGL.MapView>
    </Screen>
  )
})

const $contentContainer: ViewStyle = {
  flex: 1,
}

const $mapStyle: ViewStyle = {
  flex: 1,
  width: '100%',
  height: '100%',
}
