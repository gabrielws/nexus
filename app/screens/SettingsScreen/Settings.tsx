import { FC, useState } from "react"
import { observer } from "mobx-react-lite"
import { ViewStyle, View, TextStyle } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Text, ListItem, Header, Button } from "@/components"
import { Switch } from "@/components/Toggle/Switch"
import { spacing } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { AppStackParamList } from "@/navigators/AppNavigator"
import { supabase } from "app/services/auth/supabase"
import type { ThemedStyle } from "@/theme"
import { useTranslation } from "react-i18next"

interface SettingsScreenProps extends AppStackScreenProps<"Settings"> {}

export const SettingsScreen: FC<SettingsScreenProps> = observer(function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { themeContext, setThemeContextOverride, themed } = useAppTheme()
  const { t } = useTranslation()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Erro ao sair:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>
      <Header
        title={t("settings:title")}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        titleStyle={themed($headerTitle)}
      />

      <View style={themed($container)}>
        {/* Seção de Perfil */}
        <View style={$section}>
          <Text
            preset="formLabel"
            tx="settings:sections.profile.title"
            style={themed($sectionTitle)}
          />
          <ListItem
            tx="settings:sections.profile.editUser"
            leftIcon="settings"
            rightIcon="caretRight"
            onPress={() => navigation.navigate("EditUser")}
            style={$listItem}
          />
          <ListItem
            tx="settings:sections.profile.changePassword"
            leftIcon="lock"
            rightIcon="caretRight"
            onPress={() => navigation.navigate("ChangePassword")}
            style={$listItem}
          />
          <ListItem
            tx="settings:sections.profile.changeEmail"
            leftIcon="settings"
            rightIcon="caretRight"
            onPress={() => navigation.navigate("ChangeEmail")}
            style={$listItem}
          />
        </View>

        {/* Seção de Notificações */}
        <View style={$section}>
          <Text
            preset="formLabel"
            tx="settings:sections.notifications.title"
            style={themed($sectionTitle)}
          />
          <ListItem
            tx="settings:sections.notifications.push"
            leftIcon="bell"
            disabled
            RightComponent={
              <Switch
                disabled
                value={pushEnabled}
                onValueChange={(value) => setPushEnabled(value)}
              />
            }
            style={$listItem}
            onPress={() => setPushEnabled(!pushEnabled)}
          />
          <ListItem
            tx="settings:sections.notifications.email"
            leftIcon="bell"
            disabled
            RightComponent={
              <Switch
                disabled
                value={emailEnabled}
                onValueChange={(value) => setEmailEnabled(value)}
              />
            }
            style={$listItem}
            onPress={() => setEmailEnabled(!emailEnabled)}
          />
        </View>

        {/* Seção de Preferências */}
        <View style={$section}>
          <Text
            preset="formLabel"
            tx="settings:sections.preferences.title"
            style={themed($sectionTitle)}
          />
          <ListItem
            tx="settings:sections.preferences.darkTheme"
            leftIcon="settings"
            RightComponent={
              <Switch
                value={themeContext === "dark"}
                onValueChange={(value) => {
                  setThemeContextOverride(value ? "dark" : "light")
                }}
              />
            }
            style={$listItem}
          />
          <ListItem
            tx="settings:sections.preferences.language"
            leftIcon="settings"
            rightIcon="caretRight"
            onPress={() => navigation.navigate("Language")}
            style={$listItem}
          />
        </View>

        {/* Seção de Sobre */}
        <View style={$section}>
          <Text
            preset="formLabel"
            tx="settings:sections.about.title"
            style={themed($sectionTitle)}
          />
          <ListItem
            tx="settings:sections.about.version"
            leftIcon="ladybug"
            RightComponent={<Text text="1.0.0" />}
            style={$listItem}
            onPress={undefined}
          />
          <ListItem
            tx="settings:sections.about.terms"
            leftIcon="menu"
            rightIcon="caretRight"
            onPress={() => {}}
            style={$listItem}
          />
          <ListItem
            tx="settings:sections.about.terms"
            leftIcon="menu"
            rightIcon="caretRight"
            onPress={() => {}}
            style={$listItem}
          />
        </View>

        {/* Nova Seção de Conta */}
        <View style={$section}>
          <Text
            preset="formLabel"
            tx="settings:sections.account.title"
            style={themed($sectionTitle)}
          />
          <Button
            tx="settings:sections.account.logout"
            preset="filled"
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={$logoutButton}
          />
        </View>
      </View>
    </Screen>
  )
})

const $logoutButton: ViewStyle = {
  marginTop: spacing.xs,
}

const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $container: ViewStyle = {
  padding: spacing.md,
}

const $section: ViewStyle = {
  marginBottom: spacing.lg,
}

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  marginBottom: spacing.xs,
  color: colors.text,
})

const $listItem: ViewStyle = {
  marginBottom: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}
