module.exports = function(config){
  const mainEntries = config.entry.main;
  const index = mainEntries.findIndex(p => p.includes('vue-main-dev-entry'));
  if(index >= 0){
    mainEntries.splice(index, 1);
  }

  return config;
}
