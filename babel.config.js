module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '~': './src',
            '@components': './src/components',
            '@constants': './src/constants',
            '@hooks': './src/hooks',
            '@screens': './src/screens',
            '@services': './src/services',
            '@store': './src/store',
            '@theme': './src/theme',
            '@types': './src/types',
            '@utils': './src/utils',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
