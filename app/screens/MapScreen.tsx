/* eslint-disable no-alert */
import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import type { ViewStyle } from 'react-native'
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import { Button, Icon, Screen, Text, TextField } from '@/components'
import MapboxGL from '@rnmapbox/maps'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Config from 'app/config'
import { AnimatedFAB } from 'react-native-paper'
import { colors, spacing } from '@/theme'
import type { Feature, FeatureCollection, Point } from 'geojson'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as ImagePicker from 'expo-image-picker'

interface MapScreenProps extends AppStackScreenProps<'Map'> {}

MapboxGL.setAccessToken(Config.mapboxToken)
MapboxGL.setTelemetryEnabled(false)

interface ProblemProperties {
  description: string
  type: string
  image?: string
  active: boolean
  createdAt: string
  solvedAt?: string
  solvedBy?: string
}

type ProblemFeature = Feature<Point, ProblemProperties>
type ProblemCollection = FeatureCollection<Point, ProblemProperties>

const PROBLEM_TYPES = [
  'Buraco na via',
  'Iluminação',
  'Calçada danificada',
  'Lixo acumulado',
  'Sinalização',
  'Outros',
] as const

function createValidCoordinates(coords: [number, number]): [number, number] {
  return [
    Number(coords[0].toFixed(6)),
    Number(coords[1].toFixed(6)),
  ]
}

export const MapScreen: FC<MapScreenProps> = observer(() => {
  const [isMapReady, setIsMapReady] = useState(false)
  const [_mapLoaded, setMapLoaded] = useState(false)
  const [fabIcon, setFabIcon] = useState('plus')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null)
  const [problemDescription, setProblemDescription] = useState('')
  const [problemType, setProblemType] = useState('')
  const [temporaryMarker, setTemporaryMarker] = useState<[number, number] | null>(null)
  const [markers, setMarkers] = useState<ProblemCollection>({
    type: 'FeatureCollection',
    features: [],
  })
  const [typeModalVisible, setTypeModalVisible] = useState(false)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [selectedProblem, setSelectedProblem] = useState<ProblemFeature | null>(null)
  const [problemImage, setProblemImage] = useState<string>('')
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [descriptionError, setDescriptionError] = useState(false)
  const [typeError, setTypeError] = useState(false)
  const [imageError, setImageError] = useState(false)

  const initialCoords = {
    centerCoordinate: [-46.6388, -23.5489], // São Paulo
    zoomLevel: 10,
    pitch: 0,
    heading: 0,
  }

  useEffect(() => {
    console.log('🗺️ Starting location manager...')
    MapboxGL.locationManager.start()
    return () => {
      console.log('🗺️ Stopping location manager...')
      MapboxGL.locationManager.stop()
    }
  }, [])

  const handleFabPress = () => {
    setFabIcon(prevIcon => prevIcon === 'plus' ? 'close' : 'plus')
    setIsSelectionMode(prev => !prev)
  }

  const handleMapPress = (event: any) => {
    console.log('🗺️ Map pressed:', event.geometry.coordinates)
    if (isSelectionMode) {
      const coordinates = event.geometry.coordinates
      setSelectedPoint(coordinates)
      setTemporaryMarker(coordinates)
      setModalVisible(true)
      setIsSelectionMode(false)
      setFabIcon('plus')
      console.log('📍 New marker position:', coordinates)
    }
  }

  const handleSelectPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      alert('É necessário permissão para acessar a galeria')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    })

    if (!result.canceled) {
      setProblemImage(`data:image/jpeg;base64,${result.assets[0].base64}`)
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
      base64: true,
    })

    if (!result.canceled) {
      setProblemImage(`data:image/jpeg;base64,${result.assets[0].base64}`)
      setImageError(false)
    }
  }

  const handleSubmitProblem = () => {
    console.log('📝 Submitting problem...')

    // Reset errors
    setDescriptionError(false)
    setTypeError(false)
    setImageError(false)

    let hasError = false

    if (!problemDescription.trim()) {
      setDescriptionError(true)
      hasError = true
    }

    if (!problemType) {
      setTypeError(true)
      hasError = true
    }

    if (!problemImage) {
      setImageError(true)
      hasError = true
    }

    if (hasError) {
      return
    }

    if (!selectedPoint)
      return

    const newProblem: ProblemFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: createValidCoordinates(selectedPoint),
      },
      properties: {
        description: problemDescription,
        type: problemType || 'Problema',
        active: true,
        createdAt: new Date().toISOString(),
        image: problemImage,
      },
    }

    console.log('✨ New problem created:', newProblem)

    setMarkers((prev) => {
      const updated: ProblemCollection = {
        type: 'FeatureCollection',
        features: [...prev.features, newProblem],
      }
      console.log('📊 Updated markers count:', updated.features.length)
      return updated
    })

    setModalVisible(false)
    setProblemDescription('')
    setProblemType('')
    setSelectedPoint(null)
    setTemporaryMarker(null)
    setProblemImage('')
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setTemporaryMarker(null)
    setProblemDescription('')
    setProblemType('')
    setSelectedPoint(null)
    setProblemImage('')
    // Reset error states
    setDescriptionError(false)
    setTypeError(false)
    setImageError(false)
  }

  const handleSelectType = (type: string) => {
    setProblemType(type)
    setTypeError(false)
    setTypeModalVisible(false)
  }

  const handleProblemPress = useCallback((feature: any) => {
    const problem = feature.features[0]
    console.log('🔍 Problem selected:', problem)
    setSelectedProblem(problem)
    bottomSheetModalRef.current?.present()
  }, [])

  const handleResolveProblem = useCallback(() => {
    console.log('🔧 Resolving problem:', selectedProblem)

    if (!selectedProblem) {
      console.warn('❌ No problem selected to resolve')
      return
    }

    setMarkers((prev) => {
      console.log('Current coordinates:', selectedProblem.geometry.coordinates)

      const updatedFeatures = prev.features.map((f) => {
        console.log('Comparing with:', f.geometry.coordinates)

        // Usar toFixed para garantir a mesma precisão na comparação
        const isSameLocation
          = f.geometry.coordinates[0].toFixed(6) === selectedProblem.geometry.coordinates[0].toFixed(6)
          && f.geometry.coordinates[1].toFixed(6) === selectedProblem.geometry.coordinates[1].toFixed(6)

        if (isSameLocation) {
          console.log('✅ Match found! Marking as resolved:', f)
          return {
            ...f,
            properties: {
              ...f.properties,
              active: false,
              solvedAt: new Date().toISOString(),
            },
          }
        }
        return f
      })

      const updated: ProblemCollection = {
        type: 'FeatureCollection',
        features: updatedFeatures,
      }

      console.log('All problems after update:', updatedFeatures)
      const activeProblems = updatedFeatures.filter(f => f.properties.active)
      console.log('📊 Active problems:', activeProblems.length)
      return updated
    })

    bottomSheetModalRef.current?.dismiss()
    setSelectedProblem(null)
  }, [selectedProblem])

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
            shouldRasterizeIOS
            onDidFinishLoadingMap={() => {
              console.log('🗺️ Map loaded successfully')
              setIsMapReady(true)
              setMapLoaded(true)
            }}
            onPress={handleMapPress}
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

                <MapboxGL.ShapeSource
                  id="markersSource"
                  shape={{
                    type: 'FeatureCollection',
                    features: markers.features.filter(f => f.properties.active),
                  }}
                  onPress={handleProblemPress}
                >
                  <MapboxGL.CircleLayer
                    id="markerCircles"
                    style={{
                      circleRadius: 8,
                      circleColor: colors.palette.primary400,
                      circleStrokeWidth: 2,
                      circleStrokeColor: '#ffffff',
                    }}
                  />
                </MapboxGL.ShapeSource>

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
                        circleRadius: 8,
                        circleColor: colors.palette.accent300,
                        circleStrokeWidth: 2,
                        circleStrokeColor: '#ffffff',
                      }}
                    />
                  </MapboxGL.ShapeSource>
                )}
              </>
            )}
          </MapboxGL.MapView>

          {isSelectionMode && (
            <View style={styles.instructionContainer}>
              <Text
                preset="default"
                text="Clique no mapa para adicionar um problema"
                style={styles.instructionText}
              />
            </View>
          )}

          <AnimatedFAB
            icon={fabIcon}
            label="Adicionar"
            extended={false}
            onPress={handleFabPress}
            visible
            iconMode="dynamic"
            style={[styles.fabStyle]}
          />

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={handleCloseModal}
            statusBarTranslucent
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.modalWrapper}>
                <View
                  style={[
                    styles.modalContent,
                    {
                      paddingBottom: spacing.xl,
                    },
                  ]}
                >
                  <ScrollView>
                    <Text style={styles.modalTitle}>Adicionar Problema</Text>

                    <View style={styles.inputContainer}>
                      <Button
                        preset="default"
                        onPress={() => setTypeModalVisible(true)}
                        style={[styles.typeButton, typeError && styles.errorBorder]}
                      >
                        {problemType || 'Selecione o tipo'}
                      </Button>
                    </View>

                    <View style={styles.inputContainer}>
                      <TextField
                        label="Descrição"
                        value={problemDescription}
                        onChangeText={(text) => {
                          setProblemDescription(text)
                          setDescriptionError(false)
                        }}
                        multiline
                        numberOfLines={4}
                        placeholder="Descreva o problema"
                        status={descriptionError ? 'error' : undefined}
                      />
                    </View>

                    <View style={styles.photoContainer}>
                      <View style={styles.photoButtons}>
                        <Button
                          preset="default"
                          onPress={handleSelectPhoto}
                          style={[
                            styles.photoButton,
                            imageError && styles.errorBorder,
                          ]}
                          LeftAccessory={() => <Icon icon="gallery" style={{ marginRight: 5 }} size={20} />}
                        >
                          Galeria
                        </Button>
                        <Button
                          preset="default"
                          onPress={handleTakePhoto}
                          style={[
                            styles.photoButton,
                            imageError && styles.errorBorder,
                          ]}
                          LeftAccessory={() => <Icon icon="camera" style={{ marginRight: 5 }} size={20} />}
                        >
                          Tirar foto
                        </Button>
                      </View>
                      {!problemImage && imageError && (
                        <Text style={[styles.errorText, styles.errorMessage]}>
                          Preencha todos os campos.
                        </Text>
                      )}
                    </View>
                  </ScrollView>

                  <View style={styles.buttonContainer}>
                    <Button
                      text="Cancelar"
                      style={styles.button}
                      preset="default"
                      onPress={handleCloseModal}
                    />
                    <Button
                      text="Salvar"
                      style={styles.button}
                      preset="filled"
                      onPress={handleSubmitProblem}
                    />
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          <Modal
            visible={typeModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setTypeModalVisible(false)}
            statusBarTranslucent
          >
            <View
              style={styles.modalContainer}
              onTouchEnd={() => setTypeModalVisible(false)}
            >
              <View
                style={[styles.modalContent, styles.typeModalContent]}
                onTouchEnd={e => e.stopPropagation()}
              >
                <Text
                  preset="heading"
                  text="Selecione o tipo do problema"
                  style={styles.modalTitle}
                />

                {PROBLEM_TYPES.map(type => (
                  <Button
                    key={type}
                    text={type}
                    preset="default"
                    style={styles.typeOption}
                    onPress={() => handleSelectType(type)}
                  />
                ))}
              </View>
            </View>
          </Modal>

          <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={['60%', '90%']}
            index={0}
          >
            <BottomSheetView style={styles.bottomSheetContent}>
              {selectedProblem && (
                <>
                  <View style={styles.sheetHeader}>
                    <View style={styles.sheetTitleContainer}>
                      <Text
                        preset="heading"
                        text={selectedProblem.properties.type}
                      />
                      <Text
                        preset="formHelper"
                        text={new Date(selectedProblem.properties.createdAt).toLocaleDateString()}
                      />
                    </View>
                    <Icon
                      icon="x"
                      size={24}
                      onPress={() => bottomSheetModalRef.current?.dismiss()}
                      style={styles.closeIcon}
                    />
                  </View>

                  <Text
                    preset="formLabel"
                    text={selectedProblem.properties.description}
                    style={styles.problemDescription}
                  />
                  {selectedProblem.properties.image && (
                    <Pressable onPress={() => setIsImageFullscreen(true)}>
                      <Image
                        source={{ uri: selectedProblem.properties.image }}
                        style={styles.problemImage}
                        resizeMode="cover"
                      />
                    </Pressable>
                  )}

                  <View style={styles.bottomSheetButtons}>
                    <Button
                      text="Resolver"
                      preset="filled"
                      style={styles.resolveButton}
                      onPress={handleResolveProblem}
                    />
                  </View>
                </>
              )}
            </BottomSheetView>
          </BottomSheetModal>

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
              {selectedProblem?.properties.image && (
                <Image
                  source={{ uri: selectedProblem.properties.image }}
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
  container: {
    flexGrow: 1,
  },
  fabStyle: {
    bottom: 16,
    right: 16,
    position: 'absolute',
    backgroundColor: colors.palette.primary200,
    elevation: 6,
    backfaceVisibility: 'hidden',
  },
  instructionContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 16,
  },
  instructionText: {
    backgroundColor: colors.tintInactive,
    color: colors.text,
    padding: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.palette.overlay50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    padding: spacing.md,
    maxHeight: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 15,
  },
  typeButton: {
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: spacing.xs,
    backgroundColor: colors.background,
  },
  button: {
    minWidth: 100,
  },
  typeModalContent: {
    padding: 16,
    width: '80%',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    maxHeight: Platform.OS === 'ios' ? '70%' : '80%',
  },
  typeOption: {
    marginVertical: 4,
  },
  typeOptionContent: {
    height: 44,
  },
  closeButton: {
    marginTop: 16,
  },
  bottomSheetContent: {
    padding: 16,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  problemType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  problemDate: {
    color: '#666',
  },
  problemDescription: {
    fontSize: 16,
    marginBottom: 24,
  },
  bottomSheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  resolveButton: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  sheetTitleContainer: {
    flex: 1,
  },
  closeIcon: {
    padding: 8,
  },
  textFieldContainer: {
    marginTop: 4,
  },
  photoContainer: {
    marginBottom: 15,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  photoButton: {
    flex: 1,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.palette.overlay50,
    borderRadius: 20,
    padding: 8,
  },
  problemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
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
  errorText: {
    color: colors.error,
  },
  errorMessage: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBorder: {
    borderColor: colors.error,
    borderWidth: 1,
  },
})
