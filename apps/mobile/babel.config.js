module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  try {
    require.resolve("react-native-reanimated/plugin");
    plugins.push("react-native-reanimated/plugin");
  } catch {
    // Reanimated is optional in the current mobile tranche.
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
