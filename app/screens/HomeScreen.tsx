/* eslint-disable perfectionist/sort-imports */
/* eslint-disable ts/no-use-before-define */
/* eslint-disable ts/no-require-imports */
import type { ThemedStyle } from '@/theme'
import type { FC } from 'react'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '../navigators'
import { Button, Screen, Text } from '@/components'
import { useAppTheme } from '@/utils/useAppTheme'
import { useAuth } from 'app/services/auth/useAuth'
import { observer } from 'mobx-react-lite'
import { Image, View } from 'react-native'
import { isRTL } from '../i18n'
import { useSafeAreaInsetsStyle } from '../utils/useSafeAreaInsetsStyle'

const welcomeLogo = require('../../assets/images/logo.png')
const welcomeFace = require('../../assets/images/welcome-face.png')

interface HomeProps extends AppStackScreenProps<'Home'> {}

export const HomeScreen: FC<HomeProps> = observer(() => {
  const { themed, theme } = useAppTheme()
  const { signOut } = useAuth()

  const $bottomContainerInsets = useSafeAreaInsetsStyle(['bottom'])

  return (
    <Screen preset="fixed">
      <View style={themed($topContainer)}>
        <Image style={themed($welcomeLogo)} source={welcomeLogo} resizeMode="contain" />
        <Text
          testID="welcome-heading"
          style={themed($welcomeHeading)}
          text="Congratulations 🎉 You're signed in!"
          preset="heading"
        />
        <Text tx="welcomeScreen:exciting" preset="subheading" />
        <Image
          style={$welcomeFace}
          source={welcomeFace}
          resizeMode="contain"
          tintColor={theme.isDark ? theme.colors.palette.neutral900 : undefined}
        />
      </View>

      <View style={themed([$bottomContainer, $bottomContainerInsets])}>
        <Button onPress={signOut}>Sign Out</Button>
      </View>
    </Screen>
  )
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexShrink: 1,
  flexGrow: 1,
  flexBasis: '57%',
  justifyContent: 'center',
  paddingHorizontal: spacing.lg,
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexShrink: 1,
  flexGrow: 0,
  flexBasis: '43%',
  backgroundColor: colors.palette.neutral100,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingHorizontal: spacing.lg,
  justifyContent: 'space-around',
})

const $welcomeLogo: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 88,
  width: '100%',
  marginBottom: spacing.xxl,
})

const $welcomeFace: ImageStyle = {
  height: 169,
  width: 269,
  position: 'absolute',
  bottom: -47,
  right: -80,
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}

const $welcomeHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})
