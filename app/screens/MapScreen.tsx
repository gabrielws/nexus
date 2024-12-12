import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import type { ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import { Screen, Text } from '@/components'
// import { useNavigation } from "@react-navigation/native"
// import { useStores } from "@/models"

interface MapScreenProps extends AppStackScreenProps<'Map'> {}

export const MapScreen: FC<MapScreenProps> = observer(() => {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()

  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen style={$root} preset="scroll">
      <Text text="map" />
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}
