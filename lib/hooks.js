(function() {
  var _, genericHooks, heartbeatHooks, moment;

  _ = require("underscore");

  moment = require("moment");

  genericHooks = {
    before: {
      create: function(hook, next) {
        hook.data.created_at = (new Date).getTime();
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
      create: function(hook, next) {
        var dt;
        dt = (new Date).getTime();
        hook.data.created_at = dt;
        hook.data.last_used_at = dt;
        return next();
      },
      find: function(hook, next) {
        hook.params.query.$sort = {
          last_used_at: 1
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

  module.exports = {
    genericHooks: genericHooks,
    heartbeatHooks: heartbeatHooks
  };

}).call(this);
