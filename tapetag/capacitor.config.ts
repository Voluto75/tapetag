import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tapetagraw.app",
  appName: "TapeTag Raw",
  webDir: ".next",
  server: {
    url: "https://tapetagraw.com",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;

