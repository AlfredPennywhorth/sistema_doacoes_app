const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve o alias @/ para a pasta src/
config.resolver.alias = {
    '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
