import { View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text } from '@/components'
import { useAppTheme } from '@/utils/useAppTheme'
import { spacing } from '@/theme'

interface BadgeItemProps {
  title: string
  unlocked: boolean
}

export function BadgeItem({ title, unlocked }: BadgeItemProps) {
  const {
    theme: { colors },
  } = useAppTheme()

  const $badge: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    opacity: unlocked ? 1 : 0.5,
  }

  const $text: TextStyle = {
    color: unlocked ? colors.text : colors.textDim,
    marginLeft: spacing.xs,
  }

  return (
    <View style={$badge}>
      <MaterialCommunityIcons
        name={unlocked ? 'medal' : 'medal-outline'}
        size={24}
        color={unlocked ? colors.tint : colors.textDim}
      />
      <Text style={$text}>{title}</Text>
    </View>
  )
}
