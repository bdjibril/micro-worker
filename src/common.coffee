
generateSyncResult = (data, error) ->
  data: data
  desiredStatus: "ACTIVE"
  error: error

module.exports =
  generateSyncResult: generateSyncResult