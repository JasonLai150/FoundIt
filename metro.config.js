const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase-specific configurations removed since we migrated to Supabase
// config.resolver.sourceExts.push("cjs");
// config.resolver.unstable_enablePackageExports = false;

module.exports = config; 