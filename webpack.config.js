const path = require('node:path');

module.exports = function (options, webpack) {
  const isDev = process.env.APP_ENV_MODE === 'dev';

  return {
    ...options,
    devtool: 'source-map',

    output: {
      ...options.output, // Preserve existing output options like 'path', 'filename', etc.
      devtoolModuleFilenameTemplate: (info) => {
        // 1. Normalize and fix slashes
        const normalizedPath = path
          .normalize(info.absoluteResourcePath)
          .replace(/\\/g, '/');

        const projectRoot = path.resolve(__dirname).replace(/\\/g, '/');

        // 2. Calculate the path relative to your project root
        let relativePath = path
          .relative(projectRoot, normalizedPath)
          .replace(/\\/g, '/');

        // 3. Ensure it starts with a leading slash for that clean look
        if (!relativePath.startsWith('/')) {
          relativePath = `/${relativePath}`;
        }

        return relativePath;
      },
    },
  };
};
