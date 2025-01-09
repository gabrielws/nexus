import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import type { TextStyle, ViewStyle } from 'react-native'
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { MapScreenProps, ProblemProperties } from '../../types/types'
import { Icon, Screen } from '@/components'
import MapboxGL from '@rnmapbox/maps'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Config from '@/config'
import { colors } from '@/theme'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { DEFAULT_COORDINATES } from './config/mapDefaults'
import { MAP_STYLES } from './config/mapStyles'
import { MapControls } from './components/MapControls'
import { ProblemModal } from './components/ProblemModal'
import { ProblemBottomSheet } from './components/ProblemBottomSheet'
import { useProblems } from './hooks/useProblems'
import type { Feature, FeatureCollection, Point } from '@turf/helpers'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from '@/utils/useAppTheme'
import type { ThemedStyle } from '@/theme'
import { ActivityIndicator } from 'react-native-paper'
import { useAuth } from '@/services/auth/useAuth'
import type {
  ActionType,
  ProblemCategory,
  ProblemFormData,
} from '@/types/types'
import { useProfile } from '@/hooks/useProfile'

MapboxGL.setAccessToken(Config.mapboxToken)
MapboxGL.setTelemetryEnabled(false)

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const [isMapReady, setIsMapReady] = useState(false)
  const [_mapLoaded, setMapLoaded] = useState(false)
  const [fabIcon, setFabIcon] = useState('plus')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const { themed } = useAppTheme()
  const cameraRef = useRef<MapboxGL.Camera>(null)
  const [followUser, setFollowUser] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const [isLoadingProblems, setIsLoadingProblems] = useState(true)
  const [showLoading, setShowLoading] = useState(true)

  const {
    activeMarkers,
    selectedProblem,
    temporaryMarker,
    handleMapPress,
    addProblem,
    resolveProblem,
    selectProblem,
    clearTemporaryState,
    clearSelectedProblem,
    showXPAnimation,
    lastAction,
    fetchProblems,
  } = useProblems(user ? { id: user.id } : undefined)

  useEffect(() => {
    console.log('🗺️ Starting location manager...')
    MapboxGL.locationManager.start()
    return () => {
      console.log('🗺️ Stopping location manager...')
      MapboxGL.locationManager.stop()
    }
  }, [])

  useEffect(() => {
    if (followUser) {
      const timer = setTimeout(() => setFollowUser(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [followUser])

  useEffect(() => {
    const loadProblems = async () => {
      try {
        await fetchProblems()
      }
      finally {
        setIsLoadingProblems(false)
        setTimeout(() => {
          setShowLoading(false)
        }, 500)
      }
    }
    loadProblems()
  }, [fetchProblems])

  const handleFabPress = () => {
    setFabIcon(prevIcon => prevIcon === 'plus' ? 'close' : 'plus')
    setIsSelectionMode(prev => !prev)
  }

  const handleMapPressEvent = (event: any) => {
    const coordinates = handleMapPress(event, isSelectionMode)
    if (coordinates) {
      setModalVisible(true)
      setIsSelectionMode(false)
      setFabIcon('plus')
    }
  }

  const handleMarkerPress = (feature: any) => {
    selectProblem(feature, bottomSheetModalRef)
  }

  const handleBottomSheetClose = useCallback(() => {
    clearSelectedProblem()
  }, [clearSelectedProblem])

  const focusOnUserLocation = () => {
    setFollowUser(true)
  }

  const handleProblemSubmit = async (data: Omit<ProblemFormData, 'location'>) => {
    setIsSubmitting(true)
    try {
      await addProblem(data)
      setModalVisible(false)
    }
    finally {
      setIsSubmitting(false)
    }
  }

  const getXPForAction = (action: ActionType) => {
    switch (action) {
      case 'solve_problem':
        return 100
      case 'report_problem':
        return 50
      default:
        return 0
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Screen
          contentContainerStyle={$contentContainer}
          safeAreaEdges={['top']}
          KeyboardAvoidingViewProps={{
            behavior: Platform.OS === 'ios' ? 'padding' : undefined,
            keyboardVerticalOffset: Platform.OS === 'ios' ? -64 : 0,
          }}
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
            renderToHardwareTextureAndroid
            onDidFinishLoadingMap={() => {
              console.log('🗺️ Map loaded successfully')
              setIsMapReady(true)
              setMapLoaded(true)
            }}
            onPress={handleMapPressEvent}
          >
            {isMapReady && (
              <>
                <MapboxGL.Camera
                  ref={cameraRef}
                  followZoomLevel={18}
                  zoomLevel={18}
                  defaultSettings={DEFAULT_COORDINATES}
                  followPitch={40}
                  followUserLocation={followUser}
                />
                <MapboxGL.UserLocation />

                {activeMarkers && (
                  <MapboxGL.ShapeSource
                    id="problemsSource"
                    shape={activeMarkers}
                    onPress={handleMarkerPress}
                  >
                    <MapboxGL.CircleLayer
                      id="problemsCircle"
                      style={MAP_STYLES.marker}
                    />
                  </MapboxGL.ShapeSource>
                )}

                {temporaryMarker && (
                  <MapboxGL.ShapeSource
                    id="temporarySource"
                    shape={{
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: temporaryMarker,
                      },
                      properties: {},
                    }}
                  >
                    <MapboxGL.CircleLayer
                      id="temporaryCircle"
                      style={{
                        ...MAP_STYLES.temporaryMarker,
                        circleRadius: 8,
                      }}
                    />
                  </MapboxGL.ShapeSource>
                )}

                {selectedProblem && (
                  <MapboxGL.ShapeSource
                    id="selectedSource"
                    shape={{
                      type: 'Feature',
                      geometry: selectedProblem.geometry,
                      properties: {},
                    }}
                  >
                    <MapboxGL.CircleLayer
                      id="selectedCircle"
                      style={{
                        ...MAP_STYLES.selectedMarker,
                        circleRadius: 16,
                        circleOpacity: 0.5,
                      }}
                    />
                  </MapboxGL.ShapeSource>
                )}
              </>
            )}
          </MapboxGL.MapView>

          <MapControls
            isSelectionMode={isSelectionMode}
            fabIcon={fabIcon}
            onFabPress={handleFabPress}
            onLocationPress={focusOnUserLocation}
          />

          <ProblemModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false)
              clearTemporaryState()
            }}
            onSubmit={handleProblemSubmit}
          />

          <ProblemBottomSheet
            bottomSheetRef={bottomSheetModalRef}
            selectedProblem={selectedProblem}
            onResolve={resolveProblem}
            onClose={handleBottomSheetClose}
          />

          {showXPAnimation && (
            <Animated.View
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(500)}
              style={themed($xpAnimation)}
            >
              <Text style={themed($xpText)}>
                +
                {getXPForAction(lastAction as ActionType)}
                {' '}
                XP
              </Text>
              <Text style={themed($xpSubtext)}>
                {lastAction === 'solve_problem' ? 'Problema resolvido!' : 'Problema reportado!'}
              </Text>
              {profile && (
                <Text style={themed($levelText)}>
                  Nível
                  {' '}
                  {profile.current_level}
                </Text>
              )}
            </Animated.View>
          )}

          {isSubmitting && (
            <Animated.View
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(500)}
              style={themed($loadingContainer)}
            >
              <ActivityIndicator size="large" color={colors.palette.primary400} />
              <Text style={themed($loadingText)}>Adicionando problema...</Text>
            </Animated.View>
          )}

          {showLoading && (
            <Animated.View
              entering={FadeIn.duration(500)}
              exiting={FadeOut.duration(500)}
              style={[
                themed($loadingContainer),
                {
                  backgroundColor: isLoadingProblems
                    ? colors.palette.overlay20
                    : 'transparent',
                },
              ]}
            >
              <ActivityIndicator
                size="large"
                color={colors.palette.primary400}
                animating={isLoadingProblems}
              />
            </Animated.View>
          )}

          <Modal
            visible={isImageFullscreen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsImageFullscreen(false)}
          >
            <View style={styles.fullscreenImageContainer}>
              <Pressable
                style={styles.fullscreenCloseButton}
                onPress={() => setIsImageFullscreen(false)}
              >
                <Icon icon="x" size={24} color={colors.palette.neutral100} />
              </Pressable>
              {selectedProblem?.properties.image_url && (
                <Image
                  source={{ uri: selectedProblem.properties.image_url }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Modal>
        </Screen>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
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

const styles = StyleSheet.create({
  fullscreenImageContainer: {
    flex: 1,
    backgroundColor: colors.palette.neutral900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    backgroundColor: colors.palette.overlay50,
    borderRadius: 20,
    padding: 8,
  },
})

const $xpAnimation: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: '40%',
  alignSelf: 'center',
  backgroundColor: colors.palette.primary200,
  padding: 16,
  borderRadius: 8,
  elevation: 5,
  alignItems: 'center',
})

const $xpText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 24,
  fontWeight: 'bold',
})

const $xpSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
  marginTop: 4,
})

const $loadingContainer: ThemedStyle<ViewStyle> = () => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  marginTop: 8,
})

const $levelText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 16,
  marginTop: 4,
  fontWeight: '500',
})
