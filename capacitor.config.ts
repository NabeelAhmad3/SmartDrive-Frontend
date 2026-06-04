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
    }
  }
};

export default config;