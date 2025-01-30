import { FC } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, ListItem, Header } from "@/components"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useNavigation } from "@react-navigation/native"
import { useTranslation } from "react-i18next"
import type { ThemedStyle } from "@/theme"
import type { TxKeyPath } from "@/i18n"

interface LanguageScreenProps extends AppStackScreenProps<"Language"> {}

const languages: Array<{ code: string; name: TxKeyPath; flag: string }> = [
  { code: "pt", name: "language:portuguese", flag: "🇧🇷" },
  { code: "en", name: "language:english", flag: "🇺🇸" },
  { code: "es", name: "language:spanish", flag: "🇪🇸" },
]

export const LanguageScreen: FC<LanguageScreenProps> = observer(function LanguageScreen() {
  const navigation = useNavigation()
  const { themed } = useAppTheme()
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language?.split("-")[0] || "pt"

  const handleLanguageSelect = async (langCode: string) => {
    await i18n.changeLanguage(langCode)
    navigation.goBack()
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
      <Header
        title={t("language:title")}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        titleStyle={themed($headerTitle)}
      />

      <View style={themed($container)}>
        {languages.map((lang) => (
          <ListItem
            key={lang.code}
            text={`${lang.flag}  ${t(lang.name)}`}
            leftIcon={currentLanguage === lang.code ? "check" : undefined}
            onPress={() => handleLanguageSelect(lang.code)}
            style={$listItem}
          />
        ))}
      </View>
    </Screen>
  )
})

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $container: ViewStyle = {
  padding: spacing.md,
}

const $listItem: ViewStyle = {
  marginBottom: spacing.xs,
}
