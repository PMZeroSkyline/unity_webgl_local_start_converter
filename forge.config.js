const path = require('path');

module.exports = {
  packagerConfig: {
    icon: path.join(__dirname, 'icon')
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: path.join(__dirname, 'icon.ico'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config:{
        options: {
        }
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config:{
        options: {
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config:{
        options: {
        }
      },
    },
  ],
};
