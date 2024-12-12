/* eslint-disable unused-imports/no-unused-vars */
import type { FC } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import type { ThemedStyle } from '@/theme'
import { $styles } from '../theme'
import { LayoutAnimation, Platform, useColorScheme, View } from 'react-native'
import type { SwitchToggleProps } from '../components'
import { Button, Icon, ListItem, Screen, Switch, Text } from '../components'
import { isRTL } from '../i18n'
import { useAppTheme } from '@/utils/useAppTheme'
import { useAuth } from '@/services/auth/useAuth'

interface SettingsScreenProps extends AppStackScreenProps<'Settings'> {}

function ControlledSwitch(props: SwitchToggleProps) {
  const [value, setValue] = useState(props.value || false)
  return <Switch {...props} value={value} onPress={() => setValue(!value)} />
}

const $iconStyle: ImageStyle = { width: 20, height: 30, marginLeft: 5 }

export const SettingsScreen: FC<SettingsScreenProps> = observer(() => {
  const { setThemeContextOverride, themeContext, themed } = useAppTheme()
  const colorScheme = useColorScheme()
  const { signOut } = useAuth()

  const toggleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut) // Animate the transition
    setThemeContextOverride(themeContext === 'dark' ? 'light' : 'dark')
  }, [themeContext, setThemeContextOverride])

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={['top']}
      contentContainerStyle={[$styles.container, themed($container)]}
    >
      <Text style={themed($title)} preset="heading" text="Settings" />
      <View style={themed($itemsContainer)}>
        <ControlledSwitch
          value={themeContext === 'dark'}
          onValueChange={toggleTheme}
          labelPosition="left"
          label="Modo Escuro"
          LabelTextProps={{ preset: 'bold' }}
        />
      </View>
      <Text
        style={themed($reportBugsLink)}
        text="Report Bugs"
      />
      <View style={themed($buttonContainer)}>
        <Button
          text="Sign Out"
          preset="filled"
          onPress={signOut}
          RightAccessory={props => (
            <Icon containerStyle={props.style} icon="x" style={$iconStyle} />
          )}
        />
      </View>
    </Screen>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xl,
  flex: 1,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
})

const $reportBugsLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.sm,
  alignSelf: 'flex-end',
})

const $itemsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xl,
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: 'auto',
})
