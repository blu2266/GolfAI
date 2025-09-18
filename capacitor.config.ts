import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swingai.golfapp',
  appName: 'SwingAI',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Only use localhost URL in development mode - removed for production to use bundled assets
    ...(process.env.NODE_ENV === 'development' && {
      url: 'http://localhost:5000',
      cleartext: true
    })
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  ios: {
    allowsLinkPreview: false,
    // Only enable debugging in development mode for security
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development'
  }
};

export default config;
