const fs = require('fs');
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
function findRepoRoot(dir) {
  while (dir !== path.parse(dir).root) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        const json = JSON.parse(fs.readFileSync(pkg, 'utf8'));
        if (json.workspaces) return dir;
      } catch {
        // ignore invalid json
      }
    }
    dir = path.dirname(dir);
  }
  return path.resolve(projectRoot, '..');
}
const monorepoRoot = findRepoRoot(projectRoot);

module.exports = mergeConfig(getDefaultConfig(projectRoot), {
  projectRoot,
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    unstable_enableSymlinks: true,
  },
});
