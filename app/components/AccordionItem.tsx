import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import type { IconTypes } from '@/components'
import { Icon } from '@/components'
import { spacing } from '@/theme'
import { useAppTheme } from '@/utils/useAppTheme'

interface AccordionItemProps {
  text?: string
  leftIcon?: IconTypes[]
  leftIconColor?: string
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
  LeftComponent?: React.ReactElement
}

export function AccordionItem(props: AccordionItemProps) {
  const [expanded, setExpanded] = useState(false)
  const {
    theme: { colors },
  } = useAppTheme()

  const { text, leftIcon, leftIconColor, style, children, LeftComponent } = props

  const $container: ViewStyle = {
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  }

  const $header: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.lg,
  }

  const $content: ViewStyle = {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  }

  const $row: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  }

  const $textContainer: ViewStyle = {
    flex: 1,
    marginLeft: spacing.sm,
  }

  const $text: TextStyle = {
    color: colors.text,
    fontSize: 16,
  }

  const $caretIcon: ViewStyle = {
    transform: [{ rotate: expanded ? '90deg' : '0deg' }],
  }

  return (
    <View style={[style, $container]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={$header}>
          <View style={$row}>
            {LeftComponent || (leftIcon && (
              <Icon icon={leftIcon as any} color={leftIconColor} size={24} />
            ))}
            <View style={$textContainer}>
              <Text style={$text}>{text}</Text>
            </View>
          </View>
          <Icon
            icon="caretRight"
            size={20}
            color={colors.text}
            containerStyle={$caretIcon}
          />
        </View>
      </Pressable>
      {expanded && <View style={$content}>{children}</View>}
    </View>
  )
}
