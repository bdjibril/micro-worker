feathers = require "feathers"
hooks = require "feathers-hooks"
bodyParser = require "body-parser"
db = require "feathers-nedb"

dbHooks = require "./hooks"

class Server

  constructor: (config, baseDir="", endpointHooks) ->

    @status = "DOWN"

    address = "#{config.serverUrl}:#{config.serverPort}"

    # Need to only expose what is needed
    app = feathers()
      .configure feathers.rest()
      .configure feathers.socketio()
      .configure hooks()
      .use bodyParser.json()
      # For workers heartbeat
      .use "/heartbeat", db "heartbeat"

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