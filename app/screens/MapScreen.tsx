import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import type { ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import { Screen } from '@/components'
import MapboxGL from '@rnmapbox/maps'
import { useEffect, useState } from 'react'
import Config from 'app/config'

interface MapScreenProps extends AppStackScreenProps<'Map'> {}

MapboxGL.setAccessToken(Config.mapboxToken)
MapboxGL.setTelemetryEnabled(false)

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const [isMapReady, setIsMapReady] = useState(false)
  const [_mapLoaded, setMapLoaded] = useState(false)

  const initialCoords = {
    centerCoordinate: [-46.6388, -23.5489], // São Paulo
    zoomLevel: 10,
    pitch: 0,
    heading: 0,
  }

  useEffect(() => {
    MapboxGL.locationManager.start()
    return () => {
      MapboxGL.locationManager.stop()
    }
  }, [])

  return (
    <Screen
      contentContainerStyle={$contentContainer}
      safeAreaEdges={['top']}
    >
      <MapboxGL.MapView
        styleURL="mapbox://styles/mapbox/standard"
        style={$mapStyle}
        logoEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        surfaceView
        pitchEnabled
        rotateEnabled

        attributionEnabled={false}
        onDidFinishLoadingMap={() => {
          setIsMapReady(true)
          setMapLoaded(true)
        }}
      >
        {isMapReady && (
          <>
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
                  fillExtrusionOpacity: 0,
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
              defaultSettings={initialCoords}
              followPitch={50}
              followUserLocation
            />
            <MapboxGL.UserLocation />
          </>
        )}
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
