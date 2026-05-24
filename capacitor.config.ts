import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.87825c93ae86464ca3a1cc5c52812560',
  appName: 'FitExtremes',
  webDir: 'dist',
  server: {
    url: 'https://fitextremes.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
