import { View } from 'react-native'
import { AnimatedFAB } from 'react-native-paper'
import { Text } from '@/components'
import type { TextStyle, ViewStyle } from 'react-native'
import { useAppTheme } from '@/utils/useAppTheme'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import type { ThemedStyle } from '@/theme'

interface MapControlsProps {
  isSelectionMode: boolean
  fabIcon: string
  onFabPress: () => void
  onLocationPress: () => void
}

export function MapControls({ isSelectionMode, fabIcon, onFabPress, onLocationPress }: MapControlsProps) {
  const { themed, theme: { colors } } = useAppTheme()

  return (
    <>
      {isSelectionMode && (
        <View style={themed($instructionContainer)}>
          <Text
            preset="default"
            text="Clique no mapa para adicionar um problema"
            style={themed($instructionText)}
          />
        </View>
      )}

      <AnimatedFAB
        icon={({ size }) => (
          <MaterialCommunityIcons
            name={fabIcon === 'plus' ? 'plus' : 'close'}
            size={size}
            color={colors.text}
          />
        )}
        label="Adicionar"
        extended={false}
        onPress={onFabPress}
        visible
        iconMode="dynamic"
        style={themed($fabStyle)}
      />

      <AnimatedFAB
        icon={({ size }) => (
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={size}
            color={colors.text}
          />
        )}
        label="Localização"
        extended={false}
        onPress={onLocationPress}
        visible
        iconMode="dynamic"
        style={themed($locationFabStyle)}
      />
    </>
  )
}

const $fabStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  bottom: 16,
  right: 16,
  position: 'absolute',
  backgroundColor: colors.tintInactive,
  elevation: 6,
  backfaceVisibility: 'hidden',
})

const $instructionContainer: ThemedStyle<ViewStyle> = () => ({
  position: 'absolute',
  top: 20,
  left: 0,
  right: 0,
  alignItems: 'center',
  padding: 16,
})

const $instructionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  backgroundColor: colors.tintInactive,
  color: colors.text,
  padding: 8,
  borderRadius: 4,
})

const $locationFabStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  bottom: 80,
  right: 16,
  position: 'absolute',
  backgroundColor: colors.tintInactive,
  elevation: 6,
  backfaceVisibility: 'hidden',
})
