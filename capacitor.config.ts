import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b40f9b3deefd4b8c874bea729769a55f',
  appName: 'dispatchr-connect',
  webDir: 'dist',
  server: {
    url: 'https://b40f9b3d-eefd-4b8c-874b-ea729769a55f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3b82f6',
    },
  },
};

export default config;