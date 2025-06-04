const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs files which Firebase uses
config.resolver.sourceExts.push("cjs");

// Disable package exports to fix Firebase compatibility
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 