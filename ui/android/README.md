# Seeker Eats

A DoorDash-style food delivery app built with **Solana**, **Privy**, and **Expo**.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Ensure you set `EXPO_PUBLIC_MERCHANT_WALLET_ADDRESS` to your Solana DevNet wallet address.

### 3. Run the App
**Important:** Use this specific command to run the development client with localhost support:
```bash
npx expo start --dev-client --localhost -c
```

---

## Testing Instructions

### Option A: Android Emulator
1. Ensure **Android Studio** is installed and an emulator is running.
2. Run the start command above.
3. Press `a` in the terminal to open on Android.

### Option B: Physical Android Device
To test on a physical device, you can use the generated APK or build it yourself.

#### 1. Using the APK
If you have the APK file (typically found in `android/app/build/outputs/apk/debug/app-debug.apk` after a build), transfer it to your device and install it.

#### 2. Building from Source
If you need to rebuild the native android project:
```bash
cd android
./gradlew assembleDebug
```
The output APK will be in `android/app/build/outputs/apk/debug/`.

---

## Troubleshooting

- **"No Solana wallet connected"**: Ensure you are signed in. The embedded wallet is created automatically by Privy.
- **"Network request failed"**: Make sure you are using the `--localhost` flag in the start command if running the backend locally.
- **Build Errors**: Try cleaning the android build:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  npx expo start --dev-client --localhost -c
  ```

---

## Project Structure

- **`android/`**: Native Android project files.
- **`app/`**: Expo Router screens (pages).
- **`components/`**: Reusable UI components.
- **`services/`**: API and Solana payment logic.
- **`TESTING.md`**: Detailed testing guide with mock prices.
- **`SETUP_GUIDE.md`**: Step-by-step setup guide.
