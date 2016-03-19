(function() {
  var generateSyncResult;

  generateSyncResult = function(data, error) {
    return {
      data: data,
      desiredStatus: "ACTIVE",
      error: error
    };
  };

  module.exports = {
    generateSyncResult: generateSyncResult
  };

}).call(this);
