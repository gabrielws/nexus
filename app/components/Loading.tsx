/* eslint-disable react-native/no-inline-styles */
import { StyleProp, View, ViewStyle, ActivityIndicator } from "react-native"
import { observer } from "mobx-react-lite"
import { useAppTheme } from "@/utils/useAppTheme"

export interface LoadingProps {
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
}

/**
 * Componente de Loading que será exibido enquanto carregamos o app.
 */
export const Loading = observer(function Loading(props: LoadingProps) {
  const { style } = props
  const $styles = [$container, style]
  const { theme } = useAppTheme()

  return (
    <View style={$styles}>
      <ActivityIndicator size="large" color={theme.colors.tint} style={{ marginBottom: 16 }} />
    </View>
  )
})

const $container: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  minHeight: 400,
}
