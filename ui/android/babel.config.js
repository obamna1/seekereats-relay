module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'jose': './node_modules/jose/dist/browser/index.js',
            'crypto': 'react-native-quick-crypto',
            'stream': 'stream-browserify',
            'buffer': 'buffer',
            'zlib': 'browserify-zlib',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
