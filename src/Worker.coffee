# common methods
common = require "./common"

feathers = require "feathers-client"
io = require "socket.io-client"

_ = require "underscore"

uuid = require "node-uuid"

WorkerHeartbeat = require "./WorkerHeartbeat"

# Generic class for the Workers

class Worker

  constructor: (@config, @workerType, @nextWorkerType, @SYNC_ENDPOINT = "sync") ->

    address = "#{@config.serverUrl}:#{@config.serverPort}"

    console.log "Worker Working with the sever at: ", address

    @workerHeartbeat = new WorkerHeartbeat @config

    socket = io address

    @app = (feathers address).configure feathers.socketio socket

    @workerUuid = uuid.v4()

    # test connection (Maybe can use this to get the clients; push new workers and remove them(keep in memory on hhe server))
    # emit register worker with {type,ID}

    socket.on "connect", () =>
      console.log "Worker Connected. Type : #{@workerType}, ID : #{@workerUuid}"
      socket.emit "registerworker", {
        type: @workerType
        nextType: @nextWorkerType
        uuid: @workerUuid
      }

    # Satart listening for work
    @createListener()

    # syncEndpoint service
    @syncEndpointService = @app.service @SYNC_ENDPOINT


  createListener: =>

    workerEndpoint = @app.service @workerType

    # Scope for the callbacks
    workerUuid = @workerUuid
    doWork = @doWork
    goToNextStep = @goToNextStep

    workerEndpoint.on "created", (data) =>

      console.log "step created", data

      if data.workerUuid? and data.workerUuid isnt workerUuid
        console.log "Not my job", workerUuid, data.workerUuid
        return

      @workerHeartbeat.updateLastUsed workerUuid, @workerType, (error, heartbeat) ->
        unless error
          console.log "Updated Last used", heartbeat

      # Do work with the data. Every Worker Subclass should override doWork
      doWork data, goToNextStep

  doWork: (data, callback) ->
    # Every Sub Class should implement their own dowork
    error = "UNIMPLEMENTED: Every Sub Class should implement their own dowork"
    console.log error

    callback error, data

  generateSyncResult: common.generateSyncResult


  # Since this is used as a callback we need to use fat arrows
  goToNextStep: (error, data) =>
    unless error

      if @nextWorkerType? or data.nextWorkerType?

        # Scope for the callbacks (use data.nextWorkerType when its set)
        nextWorkerType = data.nextWorkerType or @nextWorkerType
        
        @workerHeartbeat.findNextWorker nextWorkerType, (error, nextWorkerHeartbeat) =>
          unless error
            console.log nextWorkerHeartbeat
            nextWorkerEndpoint = @app.service nextWorkerType

            # Add the workerUuid
            data.workerUuid = nextWorkerHeartbeat.uuid

            # update the last worked on
            data.last_worked_on = (new Date).getTime()

            # Send data to the next worker
            nextWorkerEndpoint.create data, (error, result) ->
              unless error
                console.log "Success creating work for  ", result

      else
        console.log "This was the last step of the flow. Nothing to do with", data

        # send a successful sync result
        syncResultObject = @generateSyncResult data, @workerType, null

        # Create a sync result
        @syncEndpointService.create syncResultObject, (error, sync) ->
          
    else

      # send an error sync result
      syncResultObject = @generateSyncResult data, @workerType, error

      # Create a sync result
      @syncEndpointService.create syncResultObject, (error, sync) ->

module.exports = Worker
