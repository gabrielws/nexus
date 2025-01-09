/* eslint-disable unused-imports/no-unused-vars */
import type { FC } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { LayoutAnimation, Pressable, useColorScheme, View } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import type { ThemedStyle } from '@/theme'
import { $styles, spacing } from '../theme'

import type { SwitchToggleProps } from '../components'
import { Button, Icon, Screen, Switch, Text } from '../components'
import { isRTL } from '../i18n'
import { useAppTheme } from '@/utils/useAppTheme'
import { useAuth } from '@/services/auth/useAuth'
import { AnimatedFAB } from 'react-native-paper'
import { Header } from '@/components'

interface SettingsScreenProps extends AppStackScreenProps<'Settings'> {}

function ControlledSwitch(props: SwitchToggleProps) {
  const [value, setValue] = useState(props.value || false)
  return <Switch {...props} value={value} onPress={() => setValue(!value)} />
}

const $iconStyle: ImageStyle = { width: 20, height: 30, marginLeft: 5 }

export const SettingsScreen: FC<SettingsScreenProps> = observer(({ navigation }) => {
  const { setThemeContextOverride, themeContext, themed } = useAppTheme()
  const {
    theme: { colors },
  } = useAppTheme()

  const toggleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setThemeContextOverride(themeContext === 'dark' ? 'light' : 'dark')
  }, [themeContext, setThemeContextOverride])

  return (
    <Screen preset="scroll" safeAreaEdges={['top', 'bottom']}>
      <Header
        title="Configurações"
        titleMode="center"
        leftIcon="caretLeft"
        backgroundColor={colors.background}
        onLeftPress={() => navigation.goBack()}
      />

      <View style={themed($container)}>
        <Text preset="formLabel" text="CONTA" style={themed($sectionTitle)} />
        <View style={themed($section)}>
          <Pressable style={themed($menuItem)} onPress={() => console.log('Editar Perfil')}>
            <Text preset="bold" text="Editar Perfil" />
            <Icon icon="caretRight" size={20} color={colors.text} />
          </Pressable>
          <View style={themed($divider)} />
          <Pressable style={themed($menuItem)} onPress={() => console.log('Alterar Senha')}>
            <Text preset="bold" text="Alterar Senha" />
            <Icon icon="caretRight" size={20} color={colors.text} />
          </Pressable>
        </View>

        <Text preset="formLabel" text="APARÊNCIA" style={themed($sectionTitle)} />
        <View style={themed($section)}>
          <ControlledSwitch
            value={themeContext === 'dark'}
            onValueChange={toggleTheme}
            labelPosition="left"
            label="Modo Escuro"
            LabelTextProps={{ preset: 'bold' }}
            containerStyle={themed($switchContainer)}
          />
        </View>

        <Text preset="formLabel" text="SOBRE" style={themed($sectionTitle)} />
        <View style={themed($section)}>
          <Text text="Nexus" style={themed($appName)} />
          <Text text="Versão 1.0.0" style={themed($versionText)} />
        </View>
      </View>
    </Screen>
  )
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.sm,
})

const $section: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xs,
  marginBottom: spacing.lg,
})

const $switchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xxs,
})

const $appName: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontFamily: typography.primary.bold,
  fontSize: 16,
  color: colors.text,
  textAlign: 'center',
})

const $versionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  opacity: 0.5,
  textAlign: 'center',
})

const $menuItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: spacing.xs,
})

const $divider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 1,
  backgroundColor: colors.border,
  opacity: 0.2,
})
