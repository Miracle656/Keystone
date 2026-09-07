// Monorepo config — see https://docs.expo.dev/guides/monorepos/
// Metro doesn't understand pnpm workspaces by default; this teaches it to (a) watch the whole
// repo so edits to packages/shared trigger a reload, and (b) resolve node_modules from both this
// app and the workspace root instead of only walking up from apps/mobile.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..", "..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// Privy's Expo SDK ships as package-exports-only, and one of its deps ("jose") needs the
// "browser" export condition — Metro doesn't enable package exports by default. Scope both
// overrides to just these packages rather than flipping unstable_enablePackageExports globally,
// since that repo-wide switch has broken resolution for other packages in the wild.
// Reference: Privy's own Expo template does the same thing.
const { resolveRequest: defaultResolveRequest } = config.resolver;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "jose") {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ["browser"] },
      moduleName,
      platform,
    );
  }
  if (moduleName.startsWith("@privy-io/")) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: true },
      moduleName,
      platform,
    );
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
