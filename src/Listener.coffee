feathers = require "feathers-client"
io = require "socket.io-client"

# Generic class for the endpoint Listeners

class Listener

  constructor: (@config, @endpoint) ->

    address = "#{@config.serverUrl}:#{@config.serverPort}"

    console.log "Listener Working with the sever at: ", address

    socket = io address

    @app = (feathers address).configure feathers.socketio socket

    # endpoint service
    endpointService = @app.service @endpoint

    # regiter event listeners
    endpointService.on "created", @created
    endpointService.on "updated", @updated
    endpointService.on "patched", @patched
    endpointService.on "removed", @removed

  created: (data) ->
    # Every Sub Class should implement their own dowork
    @error = "UNIMPLEMENTED: Every Sub Class should implement their own created"
    console.log @error

  updated: (data) ->
    # Every Sub Class should implement their own dowork
    @error = "UNIMPLEMENTED: Every Sub Class should implement their own updated"
    console.log @error

  patched: (data) ->
    # Every Sub Class should implement their own dowork
    @error = "UNIMPLEMENTED: Every Sub Class should implement their own patched"
    console.log @error

  removed: (data) ->
    # Every Sub Class should implement their own dowork
    @error = "UNIMPLEMENTED: Every Sub Class should implement their own removed"
    console.log @error

module.exports = Listener