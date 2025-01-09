import React, { useEffect } from 'react'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Text, View } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { colors, spacing } from '@/theme'
import type { ThemedStyle } from '@/theme'
import { useTheme } from 'react-native-paper'
import type { MD3Theme } from 'react-native-paper'

interface XPAnimationProps {
  xp: number
  message: string
  visible: boolean
  onComplete: () => void
}

export function XPAnimation({ xp, message, visible, onComplete }: XPAnimationProps) {
  const theme = useTheme()

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
  }, [visible, onComplete])

  if (!visible)
    return null

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(500)}
      style={$container(theme)}
    >
      <Text style={$xpText(theme)}>
        +
        {xp}
        {' '}
        XP
      </Text>
      <Text style={$message(theme)}>{message}</Text>
    </Animated.View>
  )
}

function $container(theme: MD3Theme): ViewStyle {
  return {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    elevation: 5,
    alignItems: 'center',
  }
}

function $xpText(theme: MD3Theme): TextStyle {
  return {
    color: theme.colors.onPrimary,
    fontSize: 24,
    fontWeight: '700',
  }
}

function $message(theme: MD3Theme): TextStyle {
  return {
    color: theme.colors.onPrimary,
    fontSize: 14,
    marginTop: spacing.xs,
  }
}
