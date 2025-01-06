import type { FC } from 'react'
import { observer } from 'mobx-react-lite'
import type { ViewStyle } from 'react-native'
import type { AppStackScreenProps } from '@/navigators'
import { Screen, Text } from '@/components'
import { AnimatedFAB } from 'react-native-paper'
// import { useNavigation } from "@react-navigation/native"
// import { useStores } from "@/models"

interface RewardsScreenProps extends AppStackScreenProps<'Rewards'> {}

export const RewardsScreen: FC<RewardsScreenProps> = observer(() => {
  // Pull in one of our MST stores
  // const { someStore, anotherStore } = useStores()

  // Pull in navigation via hook
  // const navigation = useNavigation()
  return (
    <Screen style={$root} preset="scroll">
      <Text text="rewards" />
    </Screen>
  )
})

const $root: ViewStyle = {
  flex: 1,
}
