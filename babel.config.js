module.exports = function (api) {
  api.cache(true);
  let plugins = ['react-native-keyboard-controller/babel'];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
