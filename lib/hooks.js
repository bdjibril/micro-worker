(function() {
  var HEARTBEAT_TIMEOUT, _, genericHooks, heartbeatHooks, moment;

  _ = require("underscore");

  moment = require("moment");

  HEARTBEAT_TIMEOUT = 5000;

  genericHooks = {
    before: {
      create: function(hook, next) {
        hook.data.created_at = new Date;
        return next();
      },
      find: function(hook, next) {
        hook.params.query.$sort = {
          last_sync_at: 1,
          created_at: -1
        };
        return next();
      }
    },
    after: {
      find: function(hook, next) {
        return next();
      }
    }
  };

  heartbeatHooks = {
    before: {
      create: genericHooks.before.create,
      find: function(hook, next) {
        hook.params.query.$sort = {
          last_used_at: 1,
          created_at: -1
        };
        return next();
      }
    },
    after: {
      find: function(hook, next) {
        hook.result = _.filter(hook.result, function(current) {
          return current.last_beat_at !== void 0 && moment().subtract(HEARTBEAT_TIMEOUT * 2, "ms").isBefore(current.last_beat_at);
        });
        return next();
      }
    }
  };

  module.exports = {
    genericHooks: genericHooks,
    heartbeatHooks: heartbeatHooks
  };

}).call(this);
