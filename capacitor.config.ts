import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';
const remoteServerUrl = process.env.CAP_SERVER_URL ?? 'https://swing-guru-brianluciano226.replit.app';

let allowNavigation: string[] = [];
try {
  const remoteHost = new URL(remoteServerUrl).host;
  allowNavigation = [remoteHost];
} catch (error) {
  console.warn('Invalid remote server URL provided for Capacitor:', error);
}

const config: CapacitorConfig = {
  appId: 'com.swingai.golfapp',
  appName: 'SwingAI',
  webDir: 'dist/public',
  server: isDev
    ? {
        androidScheme: 'https',
        url: 'http://localhost:5000',
        cleartext: true,
        allowNavigation,
      }
    : {
        androidScheme: 'https',
        url: remoteServerUrl,
        allowNavigation,
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
