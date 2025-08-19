import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

export default {
  packagerConfig: {
    asar: true,
    appBundleId: "com.marybill.conglomerate",     // macOS-specific
    appCategoryType: "public.app-category.business", // macOS App Store (optional)
    extraResource: ["resources/file.json", "resources/store.db"],
    icon: "resources/app_icon",
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "Marybill_Conglomerate", // Should match executable
        setupIcon: "resources/installer-icon.ico",
        shortcutName: "Marybill Conglomerate",
        shortcutFolderName: "Marybill Conglomerate Ltd",
        executableName: "Marybill_Conglomerate",
        noMsi: true, // Optional: prevent .msi creation
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
