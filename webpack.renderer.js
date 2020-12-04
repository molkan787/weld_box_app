const WebpackObfuscator = require('webpack-obfuscator');

module.exports = function(config){
  if(process.env.NODE_ENV !== 'development'){
    config.externals = [];
    config.plugins.push(
      new WebpackObfuscator ({
          rotateStringArray: true,
          splitStrings: true,
          splitStringsChunkLength: 3,
          selfDefending: true,
          disableConsoleOutput: true
      })
    )
  }
  return config;
}
