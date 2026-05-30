import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartdrive.tracking',
  appName: 'SmartDriveTracking',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000
    }
  }
};

export default config;