heartbeats = require "heartbeats"
feathers = require "feathers-client"
io = require "socket.io-client"

class WorkerHeartbeat

  constructor: (@config) ->

    @HEARTBEAT_INTERVAL = @config.heartBeatInterval or 5000

    @HEARTBEAT_EVENT_INCREMENT = @config.heartBeatEventIncrement or 1

    address = "#{@config.serverUrl}:#{@config.serverPort}"

    console.log "Heartbeat Working with the sever at: ", address

    socket = io address

    app = (feathers address).configure feathers.socketio socket

    @heartbeatService = app.service "heartbeat"


  beginLife: (type, uuid, callback) =>
    heart = heartbeats.createHeart @HEARTBEAT_INTERVAL

    # Create Immediatly
    newHeartbeat =
      last_beat_at: new Date
      uuid: uuid
      type: type

    @heartbeatService.create newHeartbeat, (error, heartbeat) ->
      console.log "People now know I am alive", heartbeat

    heart.createEvent @HEARTBEAT_EVENT_INCREMENT, (heartbeat, last) =>
      #console.log "Hi, I' am a #{type} with and ID of #{uuid} and I am still alive. I was born #{heart.age * HEARTBEAT_INTERVAL / 1000 } secs ago"
      # Tell People I am still alive
      @heartbeatService.find uuid: uuid ,(error, heartbeats) =>

        unless error? or heartbeats.length is 0
          # Found it
          @heartbeatService.patch heartbeats[0]._id, last_beat_at: new Date, (error, heartbeat) ->
            #console.log "People now know I still have a heartbeat", heartbeat

        else
          # Resurected from nowhere (unknown ID) Must be a ghost
          newHeartbeat =
            last_beat_at: new Date
            uuid: uuid
            type: type

          @heartbeatService.create newHeartbeat, (error, heartbeat) ->
            #console.log "People now know I am alive again (resurected)", heartbeat

      # No error Here return that heart so we ca kill it ;)
      callback null, heart


  findNextWorker: (type, callback) ->
    # Tell People I am still alive
    @heartbeatService.find type: type ,(error, heartbeats) ->
      unless error? or heartbeats.length is 0
        # Found some workers return the first one
        console.log "Next worker heartbeat is", heartbeats[0]
        callback null, heartbeats[0]

      else
        # No worker found Alive
        callback "No worker found Alive"

  updateLastUsed: (uuid, type, callback) =>
    # Tell People I am still alive
    @heartbeatService.find uuid: uuid ,(error, heartbeats) =>

      unless error? or heartbeats.length is 0
        # Found it
        @heartbeatService.patch heartbeats[0]._id, last_used_at: new Date, (error, heartbeat) ->
          console.log "Last used updated", heartbeat

      else
        # Resurected from nowhere (unknown ID) Must be a ghost
        newHeartbeat =
          last_beat_at: new Date
          last_used_at: new Date
          uuid: uuid
          type: type

        @heartbeatService.create newHeartbeat, (error, heartbeat) ->
          console.log "Recreated with Last Used", heartbeat

module.exports = WorkerHeartbeat
