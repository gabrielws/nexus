import { FC, useEffect, useRef, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, Modal, View, Text, FlatList, TouchableOpacity, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import MapboxGL from "@rnmapbox/maps"
import { Screen } from "@/components"
import Config from "@/config"
import { FloatingActionButton } from "@/components/FloatingActionButton"
import { SelectionMessage } from "@/components/SelectionMessage"
import { ReportProblemModal } from "./ReportProblemModal"
import { useStores } from "@/models"
import { colors, spacing } from "@/theme"
import type { Feature, FeatureCollection, Point, Geometry } from "geojson"
import BottomSheet from "@gorhom/bottom-sheet"
import { ProblemDetailsSheet } from "./ProblemDetailsSheet"
import { XpAnimation } from "@/components"
import { NetworkWarning } from "@/components/NetworkWarning"
import { useNetworkStatus } from "@/utils/useNetworkStatus"
import NetInfo from "@react-native-community/netinfo"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle, Theme } from "@/theme"
import { useTranslation } from "react-i18next"
// eslint-disable-next-line no-restricted-imports, @typescript-eslint/no-unused-vars
import React from "react"

MapboxGL.setAccessToken(Config.mapboxToken)
MapboxGL.setTelemetryEnabled(false)

interface MapScreenProps extends AppStackScreenProps<"Map"> {}

// Estilo do marcador
const getMarkerStyle = (isSelected: boolean, status: "active" | "solved" = "active") => {
  const baseStyle = {
    circleRadius: isSelected ? 12 : 8,
    circleStrokeWidth: isSelected ? 3 : 2,
    circleStrokeColor: colors.palette.neutral100,
    circleOpacity: isSelected ? 0.9 : 0.7,
  } as const

  if (status === "solved") {
    return {
      ...baseStyle,
      circleColor: colors.palette.colorA1, // Verde azulado para resolvidos
    } as const
  }

  return {
    ...baseStyle,
    circleColor: colors.palette.primary500, // Azul para ativos
  } as const
}

export const MapScreen: FC<MapScreenProps> = observer(function MapScreen() {
  const { t } = useTranslation()
  const { problemStore } = useStores()
  const { themed } = useAppTheme()
  const [isMapReady, setIsMapReady] = useState(false)
  const [followUser, setFollowUser] = useState(true)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null)
  const [showXpAnimation, setShowXpAnimation] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<{
    id: string
    title: string
    description: string
    category: string
    status: string
    imageUrl?: string
    reporterId: string
  } | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const cameraRef = useRef<MapboxGL.Camera>(null)
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { isConnected } = useNetworkStatus()

  useEffect(() => {
    MapboxGL.locationManager.start()
    return () => MapboxGL.locationManager.stop()
  }, [])

  // Efeito para obter a localização inicial do usuário
  useEffect(() => {
    if (isMapReady) {
      // Obtém a localização atual
      MapboxGL.locationManager.getLastKnownLocation().then((location) => {
        if (location) {
          const coordinates: [number, number] = [
            location.coords.longitude,
            location.coords.latitude,
          ]
          setUserLocation(coordinates)
        }
      })

      // Carrega os problemas iniciais se houver conexão
      if (isConnected) {
        problemStore.fetchProblems()
      }
    }
  }, [isMapReady, problemStore, isConnected])

  // Controle do followUser
  useEffect(() => {
    if (followUser) {
      const timer = setTimeout(() => setFollowUser(false), 5000)
      return () => clearTimeout(timer)
    }
    return
  }, [followUser])

  const handleMapPress = (event: Feature<Geometry>) => {
    if (!isConnected) return // Bloqueia interação sem conexão

    if (isSelectionMode && event.geometry.type === "Point") {
      const coordinates = event.geometry.coordinates as [number, number]
      setSelectedCoordinates(coordinates)
      setIsSelectionMode(false)
      console.log("Coordenadas selecionadas para adicionar problema:", coordinates)
    }
  }

  const handleFabPress = () => {
    if (!isConnected) return // Bloqueia interação sem conexão

    setIsSelectionMode(!isSelectionMode)
    if (selectedCoordinates) {
      setSelectedCoordinates(null)
    }
    console.log("Modo de seleção alternado para:", !isSelectionMode)
  }

  const handleModalClose = () => {
    setSelectedCoordinates(null)
    console.log("Modal de adicionar problema fechado")
  }

  const handleReportSuccess = () => {
    setSelectedCoordinates(null)
    console.log("Problema reportado com sucesso")
  }

  const handleProblemPress = (feature: Feature) => {
    if (!isConnected) return // Bloqueia interação sem conexão

    const problem = problemStore.problems.find((p) => p.id === feature.properties?.id)
    if (problem) {
      console.log("Marcador clicado. Problema encontrado:", problem.id)
      setSelectedProblem({
        id: problem.id,
        title: problem.title,
        description: problem.description,
        category: problem.category,
        status: problem.status,
        imageUrl: problem.imageUrl || undefined,
        reporterId: problem.reporterId,
      })
    } else {
      console.log("Nenhum problema encontrado para o marcador clicado.")
    }
  }

  const handleSheetClose = () => {
    setSelectedProblem(null)
    console.log("ProblemDetailsSheet fechado")
  }

  const handleLocationPress = () => {
    if (userLocation) {
      setFollowUser(true)
      // A câmera seguirá o usuário automaticamente por causa do followUserLocation={followUser}
    }
  }

  const handleRetryConnection = async () => {
    setIsRetrying(true)
    try {
      const state = await NetInfo.fetch()
      if (state.isConnected) {
        await problemStore.fetchProblems()
      }
    } finally {
      setIsRetrying(false)
    }
  }

  const handleHistoryPress = () => {
    setShowHistoryModal(true)
  }

  // Filtra problemas ativos e resolvidos
  const markers: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: (problemStore.problemsAsGeoJson?.features || []).filter(
      (feature) =>
        feature.properties?.status === "active" || feature.properties?.status === "solved",
    ) as Feature<Point>[],
  }

  return (
    <Screen style={$root} safeAreaEdges={["top"]}>
      <MapboxGL.MapView
        style={$mapStyle}
        styleURL="mapbox://styles/mapbox/standard"
        logoEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => setIsMapReady(true)}
        onPress={isSelectionMode ? handleMapPress : undefined}
      >
        {isMapReady && (
          <>
            <MapboxGL.Camera
              ref={cameraRef}
              followZoomLevel={18}
              zoomLevel={18}
              followUserLocation={followUser}
              animationMode="flyTo"
              // pitch={50} // Com problema
            />
            <MapboxGL.UserLocation />

            {isConnected && (
              <MapboxGL.ShapeSource
                id="problemsSource"
                shape={markers}
                onPress={(e) => handleProblemPress(e.features[0])}
              >
                {/* Camada para problemas ativos selecionados */}
                <MapboxGL.CircleLayer
                  id="problemsCircleActiveSelected"
                  style={getMarkerStyle(true, "active")}
                  filter={[
                    "all",
                    ["==", ["get", "status"], "active"],
                    ["==", ["get", "id"], selectedProblem ? selectedProblem.id : ""],
                  ]}
                />

                {/* Camada para problemas ativos não selecionados */}
                <MapboxGL.CircleLayer
                  id="problemsCircleActiveUnselected"
                  style={getMarkerStyle(false, "active")}
                  filter={[
                    "all",
                    ["==", ["get", "status"], "active"],
                    ["!=", ["get", "id"], selectedProblem ? selectedProblem.id : ""],
                  ]}
                />

                {/* Camada para problemas resolvidos selecionados */}
                <MapboxGL.CircleLayer
                  id="problemsCircleSolvedSelected"
                  style={getMarkerStyle(true, "solved")}
                  filter={[
                    "all",
                    ["==", ["get", "status"], "solved"],
                    ["==", ["get", "id"], selectedProblem ? selectedProblem.id : ""],
                  ]}
                />

                {/* Camada para problemas resolvidos não selecionados */}
                <MapboxGL.CircleLayer
                  id="problemsCircleSolvedUnselected"
                  style={getMarkerStyle(false, "solved")}
                  filter={[
                    "all",
                    ["==", ["get", "status"], "solved"],
                    ["!=", ["get", "id"], selectedProblem ? selectedProblem.id : ""],
                  ]}
                />
              </MapboxGL.ShapeSource>
            )}
          </>
        )}
      </MapboxGL.MapView>

      {!isConnected && <NetworkWarning onRetry={handleRetryConnection} isRetrying={isRetrying} />}

      <SelectionMessage visible={isSelectionMode && isConnected} />

      {/* Botão de localização */}
      <FloatingActionButton
        onPress={handleLocationPress}
        icon="navigation"
        style={$locationButton}
        disabled={!isMapReady || !userLocation}
      />

      <FloatingActionButton
        onPress={handleFabPress}
        icon={isSelectionMode ? "close" : "add"}
        disabled={!isMapReady || !isConnected}
      />

      {/* Botão de histórico */}
      <FloatingActionButton
        onPress={handleHistoryPress}
        icon="history"
        style={$historyButton}
        disabled={!isMapReady || !isConnected}
      />

      <Modal
        visible={!!selectedCoordinates && isConnected}
        animationType="slide"
        onRequestClose={handleModalClose}
        statusBarTranslucent
      >
        {selectedCoordinates && (
          <ReportProblemModal
            coordinates={selectedCoordinates}
            onClose={handleModalClose}
            onSuccess={handleReportSuccess}
            onShowXp={() => setShowXpAnimation(true)}
          />
        )}
      </Modal>

      <ProblemDetailsSheet
        bottomSheetRef={bottomSheetRef}
        problem={selectedProblem}
        onClose={handleSheetClose}
        onShowXp={() => setShowXpAnimation(true)}
      />

      {/* Animação de XP */}
      {showXpAnimation && (
        <View style={$xpAnimationContainer}>
          <XpAnimation xp={100} onAnimationComplete={() => setShowXpAnimation(false)} />
        </View>
      )}

      {/* Modal de Histórico */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}
        statusBarTranslucent
      >
        <Screen preset="fixed" safeAreaEdges={["top"]} style={themed($modalContainer)}>
          <View style={themed($modalHeader)}>
            <Text style={themed($modalTitle)}>{t("map:history.title")}</Text>
            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              style={themed($closeButton)}
            >
              <Text style={themed($closeButtonText)}>{t("common:close")}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={problemStore.solvedProblems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={$listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={themed($historyItem)}
                onPress={() => {
                  setShowHistoryModal(false)
                  setSelectedProblem({
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    status: item.status,
                    imageUrl: item.imageUrl || undefined,
                    reporterId: item.reporterId,
                  })
                }}
              >
                <View style={$historyItemContent}>
                  <Text style={themed($historyItemTitle)}>{item.title}</Text>
                  <Text style={themed($historyItemCategory)}>{item.category}</Text>
                  <Text style={themed($historyItemDate)}>
                    {t("map:history.solvedOn")}{" "}
                    {item.solvedAt
                      ? new Date(item.solvedAt).toLocaleDateString("pt-BR")
                      : t("map:history.unknownDate")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={$emptyContainer}>
                <Text style={themed($emptyText)}>{t("map:history.empty")}</Text>
              </View>
            )}
          />
        </Screen>
      </Modal>
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}

const $mapStyle: ViewStyle = {
  width: "100%",
  height: "100%",
}

const $xpAnimationContainer: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  pointerEvents: "none",
}

const $locationButton: ViewStyle = {
  position: "absolute",
  right: spacing.lg,
  bottom: spacing.lg + 72,
}

const $historyButton: ViewStyle = {
  position: "absolute",
  right: spacing.lg,
  bottom: spacing.lg + 144,
}

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors }: Theme) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ colors }: Theme) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }: Theme) => ({
  fontSize: 18,
  fontWeight: "bold",
  color: colors.text,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  padding: spacing.xs,
})

const $closeButtonText: ThemedStyle<TextStyle> = ({ colors }: Theme) => ({
  color: colors.tint,
  fontSize: 16,
})

const $listContent: ViewStyle = {
  padding: spacing.md,
}

const $historyItem: ThemedStyle<ViewStyle> = ({ colors }: Theme) => ({
  backgroundColor: colors.background,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
})

const $historyItemContent: ViewStyle = {
  gap: spacing.xs,
}

const $historyItemTitle: ThemedStyle<TextStyle> = ({ colors }: Theme) => ({
  fontSize: 16,
  fontWeight: "bold",
  color: colors.text,
})

const $historyItemCategory: ThemedStyle<TextStyle> = ({ colors }: Theme) => ({
  fontSize: 14,
  color: colors.textDim,
  textTransform: "capitalize",
})

const $historyItemDate: ThemedStyle<TextStyle> = ({ colors }: Theme) => ({
  fontSize: 12,
  color: colors.textDim,
})

const $emptyContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.xl,
}

const $emptyText: ThemedStyle<TextStyle> = ({ colors }: Theme) => ({
  fontSize: 16,
  color: colors.textDim,
  textAlign: "center",
})
