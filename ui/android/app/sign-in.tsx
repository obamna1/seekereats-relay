import { AppText } from '@/components/app-text'
import { useAuth } from '@/components/auth/auth-provider'
import { AppConfig } from '@/constants/app-config'
import { Colors } from '@/constants/colors'
import { Button } from '@react-navigation/elements'
import { Image } from 'expo-image'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Ionicons } from '@expo/vector-icons'
import { useLoginWithEmail } from '@privy-io/expo'
import { ResizeMode, Video } from 'expo-av'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'

// Helper function to get user-friendly error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      return 'Too many attempts. Please try again later.'
    }
    if (error.message.includes('invalid code')) {
      return 'Invalid code. Please check and try again.'
    }
    if (error.message.includes('expired')) {
      return 'Code expired. Please request a new code.'
    }
    if (error.message.includes('email')) {
      return 'Please enter a valid email address.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export default function SignIn() {
  const { signInWithGoogle, signInWithWallet, isLoading: isAuthLoading } = useAuth()
  const { state, sendCode, loginWithCode } = useLoginWithEmail()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const codeInputRef = useRef<TextInput>(null)

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const videoOpacity = useSharedValue(0);

  // Configuration
  const VIDEO_DIMMING = 0.5; // Configurable dimming (0-1), higher is darker

  useEffect(() => {
    // Start animations on mount
    logoOpacity.value = withDelay(300, withSpring(1));
    logoScale.value = withDelay(300, withSpring(1));
    
    formOpacity.value = withDelay(800, withSpring(1));
    formTranslateY.value = withDelay(800, withSpring(0));
    
    videoOpacity.value = withDelay(100, withSpring(1, { damping: 20, stiffness: 90 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const videoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: videoOpacity.value,
  }));

  const isLoading = isAuthLoading || state.status === 'submitting-code'

  // Countdown for resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timeout = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timeout)
    }
  }, [resendTimer])

  // Auto-focus code input when code screen appears
  useEffect(() => {
    if (state.status === 'awaiting-code-input') {
      setTimeout(() => codeInputRef.current?.focus(), 300)
    }
  }, [state.status])

  const handleEmailLogin = async () => {
    // Validate email presence
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address')
      return
    }

    try {
      await sendCode({ email })
      setResendTimer(60)  // Start 60 second cooldown
      Alert.alert('Code Sent', 'Check your email for the verification code.')
    } catch (e) {
      const message = getErrorMessage(e)
      Alert.alert('Error', message)
      console.error(e)
    }
  }

  const handleCodeLogin = async (codeValue?: string) => {
    const codeToUse = codeValue || code
    if (codeToUse.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit code')
      return
    }

    try {
      await loginWithCode({ code: codeToUse, email })
      console.log('[Auth] Login successful')
    } catch (e) {
      const message = getErrorMessage(e)
      Alert.alert('Login Failed', message)
      console.error(e)
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return

    try {
      await sendCode({ email })
      setResendTimer(60)
      Alert.alert('Success', 'Code sent! Check your email.')
    } catch (e) {
      const message = getErrorMessage(e)
      Alert.alert('Error', message)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      const message = getErrorMessage(error)
      Alert.alert('Sign In Failed', message)
    }
  }

  // Auto-submit when 6 digits entered
  const handleCodeChange = (text: string) => {
    setCode(text)
    if (text.length === 6) {
      // Pass the text directly to avoid stale state
      handleCodeLogin(text)
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.videoContainer, videoAnimatedStyle]}>
        <Video
          source={require('../assets/login-background.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay
          isMuted
        />
        <View style={[styles.dimmingOverlay, { opacity: VIDEO_DIMMING }]} />
      </Animated.View>
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.light.primary} />
      ) : (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.spacer} />

              <Animated.View style={[styles.header, logoStyle]}>
                <Image 
                  source={require('../assets/seekereats_logo.png')} 
                  style={styles.logo} 
                  contentFit="contain"
                />
                <AppText type="title" style={{ color: Colors.light.primary }}>{AppConfig.name}</AppText>
              </Animated.View>

              <Animated.View style={[styles.formContainer, formStyle]}>

            {state.status === 'initial' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#A1A1AA" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#A1A1AA"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => handleEmailLogin()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue with Email</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => handleGoogleSignIn()}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.googleButtonText}>Sign In with Google</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <AppText style={styles.instructionText}>
                  Enter the code sent to {email}
                </AppText>
                <TextInput
                  ref={codeInputRef}
                  style={styles.input}
                  value={code}
                  onChangeText={handleCodeChange}
                  placeholder="123456"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <Button
                  variant="filled"
                  onPress={() => handleCodeLogin()}
                  style={styles.button}
                  disabled={isLoading}
                >
                  Login
                </Button>
                <Button
                  variant="tinted"
                  onPress={handleResendCode}
                  style={styles.button}
                  disabled={resendTimer > 0 || isLoading}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </Button>
                <Button
                  variant="plain"
                  onPress={() => setEmail('')}
                  style={styles.button}
                >
                  Use a different email
                </Button>
              </>
            )}
          </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for video
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  dimmingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 40,
  },
  spacer: {
    height: 20,
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  formContainer: {
    marginBottom: 32,
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)', // More transparent for video
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#A1A1AA',
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#A1A1AA',
  },
})
