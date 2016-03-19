# common methods
common = require "./common"

feathers = require "feathers-client"
io = require "socket.io-client"

async = require "async"

_ = require "underscore"


# Generic class for the Syncs

class Sync

  constructor: (@config, @syncChecks, @entityEndpoint, @fix = true, @SYNC_ENDPOINT = "sync", @SYNC_INTERVAL = 10000, @CONCURRENT_SYNC = 10) ->

    address = "#{@config.serverUrl}:#{@config.serverPort}"

    console.log "Sync Working with the sever at: ", address

    socket = io address

    @app = (feathers address).configure feathers.socketio socket

    @entitySyncEndpointService = @app.service @SYNC_ENDPOINT
    @entityEndpointService = @app.service @entityEndpoint

    # Starting the first instance of sync
    setTimeout @startSync, @SYNC_INTERVAL

  # using fat arrow since this is used as a callback
  startSync: =>
    console.log "Sync started"

    # Finding all the Entities to work with
    @findEntitiesToSync @handleEntitiesFound

  # using fat arrow since this is used as a callback
  handleEntitiesFound: (error, entities) =>
    if error or entities.length is 0
      console.log "No SYNCABLE entities found will not attempt any sync"

      setTimeout @startSync, @SYNC_INTERVAL

    else
      # add where last sync is < some timeout

      startSyncFunc = @startSync
      syncInterval = @SYNC_INTERVAL

      async.eachLimit entities, @CONCURRENT_SYNC, @syncEntity, (err) ->
        if err
          console.log "Some entities did not Go trough all the tests.", err
        else
          console.log "All entities Went trough all the tests."

        setTimeout startSyncFunc, syncInterval

  # using fat arrow since this is used as a callback
  syncEntity: (entity, callback) =>

    entityEndpointService = @entityEndpointService

    updateLastSync = (innerCallback) ->
      entityEndpointService.find _id: entity._id, (error, matchingEntities) ->
        unless error? or matchingEntities.length is 0
          # Found it
          entityEndpointService.patch matchingEntities[0]._id, last_sync_at: new Date, (error, updatedEntity) ->
            unless error
              innerCallback null, updatedEntity

    waterFallFunctions = [updateLastSync]
    waterFallFunctions.push wFunction for wFunction in @syncChecks

    syncCb = @syncCallback

    async.waterfall waterFallFunctions, (error, result) ->

      syncCb error, result, callback


  syncCallback: (err, entity, callback) =>

    returnError = null

    if err
      console.log err

      # Set the return error
      returnError = err

      if @fix
        # Create a fix
        @fixEntity entity, (err, result) ->
          if err
            console.log "Error while creating the fix", err
          else
            console.log "Successfully created the fix", result


    syncResultObject = @generateSyncResult device: entity, returnError

    # Create a sync result
    @entitySyncEndpointService.create syncResultObject, (error, sync) ->
      if error
        callback error
      else
        # Not Rerurning error so that the sync each goes trough all
        # callback returnError, sync
        callback null, sync

  generateSyncResult: common.generateSyncResult

  findEntitiesToSync: (callback) ->
    callback "UNIMPLEMENTED (findEntitiesToSync): This method needs to be implemented in the Sync Subclass"

  fixEntity: (entity, callback) ->
    callback "UNIMPLEMENTED (fixEntity): This method needs to be implemented in the Sync Subclass", entity

module.exports = Sync
