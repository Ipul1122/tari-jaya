import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tarijaya.inventory',
  appName: 'Tari Jaya Inventory',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
