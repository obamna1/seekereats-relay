import { AppProviders } from '@/components/app-providers'
import { useAuth } from '@/components/auth/auth-provider'
import { useTrackLocations } from '@/hooks/use-track-locations'
import { PortalHost } from '@rn-primitives/portal'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import 'fast-text-encoding'
import { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import 'react-native-reanimated'

SplashScreen.preventAutoHideAsync()

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'

export default function RootLayout() {
  // Use this hook to track the locations for analytics or debugging.
  // Delete if you don't need it.
  useTrackLocations((pathname, params) => {
    console.log(`Track ${pathname}`, { params })
  })
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  const onLayoutRootView = useCallback(async () => {
    console.log('onLayoutRootView')
    if (loaded) {
      console.log('loaded')
      await SplashScreen.hideAsync()
    }
  }, [loaded])

  // Safety timeout to ensure splash screen hides
  useEffect(() => {
    const timeout = setTimeout(async () => {
      console.log('Force hiding splash screen')
      await SplashScreen.hideAsync()
    }, 5000)
    return () => clearTimeout(timeout)
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AppProviders>
        {/* <AppSplashController /> */}
        <RootNavigator />
        <StatusBar style="auto" />
        {/* TODO: Uncomment after rebuilding with expo-clipboard native module */}
        {/* <PrivyElements /> */}
      </AppProviders>
      <PortalHost />
    </View>
  )
}

function RootNavigator() {
  const { isAuthenticated } = useAuth()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" redirect={!isAuthenticated} />
      <Stack.Screen name="sign-in" redirect={isAuthenticated} />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}
