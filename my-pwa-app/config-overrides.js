const { override } = require("customize-cra");

module.exports = override((config, env) => {
  // Only apply these changes in production
  if (env === "production") {
    config.output.publicPath = "./"; // Relative paths for production
    config.output.filename = "static/js/main.js"; // Fixed JS name
    config.plugins = config.plugins.map((plugin) => {
      if (plugin.constructor.name === "MiniCssExtractPlugin") {
        plugin.options.filename = "static/css/main.css"; // Fixed CSS name
      }
      return plugin;
    });
  }
  return config;
});
