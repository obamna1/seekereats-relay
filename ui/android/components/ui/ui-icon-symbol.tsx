// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { SymbolViewProps } from 'expo-symbols'
import { ComponentProps } from 'react'
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native'

type UiIconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>
export type UiIconSymbolName = keyof typeof MAPPING

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Home icons
  'house.fill': 'home',
  'house': 'home',

  // Orders/History icons
  'list.bullet.clipboard.fill': 'receipt',
  'list.bullet.clipboard': 'receipt-long',
  'clock.fill': 'history',
  'clock': 'history',

  // Cart icons
  'cart.fill': 'shopping-cart',
  'cart': 'shopping-cart',
  'bag.fill': 'shopping-bag',
  'bag': 'shopping-bag',

  // Account/Profile icons
  'person.fill': 'person',
  'person': 'person-outline',

  // Settings icons
  'gearshape.fill': 'settings',
  'gearshape': 'settings',

  // Wallet icons
  'wallet.pass.fill': 'wallet',
  'wallet.pass': 'account-balance-wallet',

  // Demo/Debug icons
  'ladybug.fill': 'bug-report',
  'ladybug': 'bug-report',
} as UiIconMapping

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function UiIconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: UiIconSymbolName
  size?: number
  color: string | OpaqueColorValue
  style?: StyleProp<TextStyle>
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />
}
