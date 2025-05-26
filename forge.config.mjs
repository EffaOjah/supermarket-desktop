// const { FusesPlugin } = require('@electron-forge/plugin-fuses');
// const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// module.exports = {
//   packagerConfig: {
//   asar: true,
//   extraResource: ['resources/store.db'], // 👈 this makes it accessible via process.resourcesPath
// },
//   rebuildConfig: {},
//   makers: [
//     {
//       name: '@electron-forge/maker-squirrel',
//       config: {},
//     },
//     {
//       name: '@electron-forge/maker-zip',
//       platforms: ['darwin'],
//     },
//     {
//       name: '@electron-forge/maker-deb',
//       config: {},
//     },
//     {
//       name: '@electron-forge/maker-rpm',
//       config: {},
//     },
//   ],
//   plugins: [
//     {
//       name: '@electron-forge/plugin-auto-unpack-natives',
//       config: {},
//     },
//     // Fuses are used to enable/disable various Electron functionality
//     // at package time, before code signing the application
//     new FusesPlugin({
//       version: FuseVersion.V1,
//       [FuseV1Options.RunAsNode]: false,
//       [FuseV1Options.EnableCookieEncryption]: true,
//       [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
//       [FuseV1Options.EnableNodeCliInspectArguments]: false,
//       [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
//       [FuseV1Options.OnlyLoadAppFromAsar]: true,
//     }),
//   ],
// };


import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

export default {
  packagerConfig: {
    asar: true,
    extraResource: ['resources/store.db'],
    icon: 'resources/app_icon', // 👈 Added this line
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
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
