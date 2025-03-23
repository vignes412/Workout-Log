const { override } = require("customize-cra");

module.exports = override((config) => {
  config.output.publicPath = "./"; // Relative paths
  config.output.filename = "static/js/main.js"; // Fixed JS name
  config.plugins = config.plugins.map((plugin) => {
    if (plugin.constructor.name === "MiniCssExtractPlugin") {
      plugin.options.filename = "static/css/main.css"; // Fixed CSS name
    }
    return plugin;
  });
  return config;
});
