
generateSyncResult = (data, workerType, error, entityName) ->
  res =
    desiredStatus: "ACTIVE"
    workerType: workerType
    error: error

  res[entityName or "data"] = data[entityName] or data.data or data

  res

module.exports =
  generateSyncResult: generateSyncResult