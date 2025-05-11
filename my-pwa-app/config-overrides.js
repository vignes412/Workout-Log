const { override, addWebpackResolve } = require("customize-cra");

module.exports = override(
  // Add resolve configuration to handle TypeScript files
  addWebpackResolve({
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  }),
  
  // Original config modifications
  (config, env) => {
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
    
    // Add fallback for TensorFlow.js dependencies
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  }
);
