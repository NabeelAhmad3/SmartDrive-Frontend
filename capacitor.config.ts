import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartdrive.tracking',
  appName: 'Smart-Drive-Tracking',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    minWebViewVersion: 60
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000
    },
    BackgroundRunner: {
      label: 'com.smartdrive.background',
      src: 'background.js',
      event: 'locationUpdate',
      repeat: true,
      interval: 15,
      autoStart: false,
    },
    Geolocation: {
      permissions: {
        ios: ['whenInUse', 'always'],
        android: ['coarse', 'fine', 'background'],
      }
    }
  }
};

export default config;