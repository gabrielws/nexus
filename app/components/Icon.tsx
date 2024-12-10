/* eslint-disable ts/no-use-before-define */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable ts/no-require-imports */
import type { ComponentType } from 'react'
import type {
  ImageStyle,
  StyleProp,
  TouchableOpacityProps,
  ViewProps,
  ViewStyle,
} from 'react-native'
import { useAppTheme } from '@/utils/useAppTheme'
import {
  Image,
  TouchableOpacity,
  View,
} from 'react-native'

export type IconTypes = keyof typeof iconRegistry

interface IconProps extends TouchableOpacityProps {
  /**
   * The name of the icon
   */
  icon: IconTypes

  /**
   * An optional tint color for the icon
   */
  color?: string

  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number

  /**
   * Style overrides for the icon image
   */
  style?: StyleProp<ImageStyle>

  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>

  /**
   * An optional function to be called when the icon is pressed
   */
  onPress?: TouchableOpacityProps['onPress']
}

/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity /> if `onPress` is provided, otherwise a <View />.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {IconProps} props - The props for the `Icon` component.
 * @returns {JSX.Element} The rendered `Icon` component.
 */
export function Icon(props: IconProps) {
  const {
    icon,
    color,
    size,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    ...WrapperProps
  } = props

  const isPressable = !!WrapperProps.onPress
  const Wrapper = (WrapperProps?.onPress ? TouchableOpacity : View) as ComponentType<
    TouchableOpacityProps | ViewProps
  >

  const { theme } = useAppTheme()

  const $imageStyle: StyleProp<ImageStyle> = [
    $imageStyleBase,
    { tintColor: color ?? theme.colors.text },
    size !== undefined && { width: size, height: size },
    $imageStyleOverride,
  ]

  return (
    <Wrapper
      accessibilityRole={isPressable ? 'imagebutton' : undefined}
      {...WrapperProps}
      style={$containerStyleOverride}
    >
      <Image style={$imageStyle} source={iconRegistry[icon]} />
    </Wrapper>
  )
}

export const iconRegistry = {
  back: require('../../assets/icons/back.png'),
  bell: require('../../assets/icons/bell.png'),
  caretLeft: require('../../assets/icons/caretLeft.png'),
  caretRight: require('../../assets/icons/caretRight.png'),
  check: require('../../assets/icons/check.png'),
  hidden: require('../../assets/icons/hidden.png'),
  ladybug: require('../../assets/icons/ladybug.png'),
  lock: require('../../assets/icons/lock.png'),
  menu: require('../../assets/icons/menu.png'),
  more: require('../../assets/icons/more.png'),
  settings: require('../../assets/icons/settings.png'),
  view: require('../../assets/icons/view.png'),
  x: require('../../assets/icons/x.png'),
}

const $imageStyleBase: ImageStyle = {
  resizeMode: 'contain',
}
