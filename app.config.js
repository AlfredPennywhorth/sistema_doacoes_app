export default ({ config }) => {
  const plugins = Array.from(
    new Set([
      ...(config.plugins ?? []),
      "expo-asset",
      "expo-font",
      "expo-web-browser",
    ]),
  );

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
    },
  };
};
