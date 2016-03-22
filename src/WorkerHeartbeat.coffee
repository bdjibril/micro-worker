feathers = require "feathers-client"
io = require "socket.io-client"

class WorkerHeartbeat

  constructor: (@config) ->

    address = "#{@config.serverUrl}:#{@config.serverPort}"

    console.log "Heartbeat Working with the sever at: ", address

    socket = io address

    app = (feathers address).configure feathers.socketio socket

    @heartbeatService = app.service "heartbeat"


  createHeartbeats: (heartbeat, callback) ->

    @heartbeatService.create  heartbeat, (error, heartbeat) ->
      unless error
        callback null, "Success regigistering heartbeat, for uuid: #{heartbeat.uuid} "
      else
        console.log error

  findNextWorker: (type, callback) ->
    # Tell People I am still alive
    @heartbeatService.find {type: type, $limit: 1} ,(error, heartbeats) ->
      unless error? or heartbeats.length is 0
        # Found some workers return the first one
        console.log "Next worker heartbeat is", heartbeats[0]
        callback null, heartbeats[0]

      else
        # No worker found Alive
        callback "No worker found Alive"

  updateLastUsed: (uuid, type, callback) =>
    # Tell People I am still alive
    @heartbeatService.find {uuid: uuid, $limit: 1} ,(error, heartbeats) =>

      dt = new Date

      unless error? or heartbeats.length is 0
        # Found it
        @heartbeatService.patch heartbeats[0]._id or heartbeats[0].id, last_used_at: dt, (error, heartbeat) ->
          console.log "Last used updated", heartbeat

  deregisterWorkerHeartBeat: (uuid, callback) =>
    @heartbeatService.find uuid: uuid ,(error, heartbeats) =>

      unless error? or heartbeats.length is 0
        # Found it
        @heartbeatService.remove heartbeats[0]._id or heartbeats[0].id, null , (error) ->
          if error
            callback "error while unregistering the workerHeartbeat #{error}"
          else
            callback null, "Successfully Unregistered the heartbeat for uuid: #{uuid}"

      else
        console.log "heartbeat not found", error, heartbeats, uuid
        callback "heartbeat not found", heartbeats

module.exports = WorkerHeartbeat
