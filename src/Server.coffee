feathers = require "feathers"
hooks = require "feathers-hooks"
bodyParser = require "body-parser"
db = require "feathers-nedb"
memory = require "feathers-memory"

socketio = feathers.socketio

dbHooks = require "./hooks"

WorkerHeartbeat = require "./WorkerHeartbeat"

class Server

  constructor: (config, baseDir="", endpointHooks) ->

    @status = "DOWN"

    address = "#{config.serverUrl}:#{config.serverPort}"

    workerHeartbeat = new WorkerHeartbeat config

    # Need to only expose what is needed
    app = feathers()
      .configure feathers.rest()
      .configure socketio( (io) ->
        io.on "connection", (socket) ->
          console.log "Conected event from the server"
          wInfo = null
          socket.on "registerworker", (workerInfo) ->
            wInfo = workerInfo
            wInfo.socketId = socket.id
            console.log "Registering worker", wInfo

            workerHeartbeat.createHeartbeats wInfo, (err, result) ->
              unless err
                console.log result

            socket.on "disconnect", () ->
              console.log "Disconnecting worker", wInfo
              workerHeartbeat.deregisterWorkerHeartBeat wInfo.uuid, (err, result) ->
                unless err
                  console.log result

       )
      .configure hooks()
      .use bodyParser.json()
      # For workers heartbeat
      .use "/heartbeat", memory "heartbeat"

    # Hooks for workers heartbeat endpoint
    (app.service "heartbeat").before(
      create: dbHooks.heartbeatHooks.before.create
      find: dbHooks.heartbeatHooks.before.find
    ).after find: dbHooks.heartbeatHooks.after.find

    for endpointKey, endpointValue of config.endpoint
      # Register an endpoint for each
      app.use "/#{endpointValue}", db endpointValue

      # Would use the generic hook unless a custom one is specified in the endpointHooks
      epHook = if endpointHooks? and endpointHooks[endpointKey]? then endpointHooks[endpointKey] else dbHooks.genericHooks

      (app.service endpointValue).before(
        create: epHook.before.create
        find: epHook.before.find
      ).after find: epHook.after.find


    # Main path for static asets
    app.use "/", feathers.static "#{baseDir}/#{config.staticPath or 'ui'}"

    app.listen config.serverPort

    console.log "Server is now listening on port #{config.serverPort}"

    @status = "UP"

  getStatus: -> @status

  module.exports = Server