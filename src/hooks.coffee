_ = require "underscore"
moment = require "moment"
HEARTBEAT_TIMEOUT = 5000

# DB hooks
genericHooks =
  before:
    create: (hook, next) ->
      # Add the created_at date
      hook.data.created_at = new Date
      # Go to the next step (save to database)
      next()
      
    find: (hook, next) ->
      # Sort the result list by created_at date
      hook.params.query.$sort =
        last_sync_at: 1
        created_at: -1
      next()

  after:
    find: (hook, next) ->
      #size = hook.result.length
      # Only  the last 10
      #if size >= 10
      #  hook.result = hook.result.slice(size - 10, size)
      next()

heartbeatHooks =
  before:
    create: genericHooks.before.create
      
    find: (hook, next) ->
      # Sort the result list by created_at date
      hook.params.query.$sort =
         last_used_at: 1
         created_at: -1
      next()

  after:
    find: (hook, next) ->
      hook.result = _.filter hook.result,  (current) ->
        current.last_beat_at isnt undefined and moment().subtract(HEARTBEAT_TIMEOUT * 2, "ms").isBefore current.last_beat_at
        
      next()

module.exports =
  genericHooks: genericHooks
  heartbeatHooks: heartbeatHooks