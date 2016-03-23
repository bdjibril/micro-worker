(function() {
  var generateSyncResult;

  generateSyncResult = function(data, workerType, error, entityName) {
    var res;
    res = {
      desiredStatus: "ACTIVE",
      workerType: workerType,
      error: error
    };
    res[entityName || "data"] = data[entityName] || data.data || data;
    return res;
  };

  module.exports = {
    generateSyncResult: generateSyncResult
  };

}).call(this);
