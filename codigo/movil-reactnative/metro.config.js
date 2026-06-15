const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Deshabilitar package exports resolution que causa conflictos en RN 0.76 + SDK 54
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
