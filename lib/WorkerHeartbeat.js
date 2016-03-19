(function() {
  var WorkerHeartbeat, feathers, heartbeats, io,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  heartbeats = require("heartbeats");

  feathers = require("feathers-client");

  io = require("socket.io-client");

  WorkerHeartbeat = (function() {
    function WorkerHeartbeat(config) {
      var address, app, socket;
      this.config = config;
      this.updateLastUsed = bind(this.updateLastUsed, this);
      this.beginLife = bind(this.beginLife, this);
      this.HEARTBEAT_INTERVAL = this.config.heartBeatInterval || 5000;
      this.HEARTBEAT_EVENT_INCREMENT = this.config.heartBeatEventIncrement || 1;
      address = this.config.serverUrl + ":" + this.config.serverPort;
      console.log("Heartbeat Working with the sever at: ", address);
      socket = io(address);
      app = (feathers(address)).configure(feathers.socketio(socket));
      this.heartbeatService = app.service("heartbeat");
    }

    WorkerHeartbeat.prototype.beginLife = function(type, uuid, callback) {
      var heart, newHeartbeat;
      heart = heartbeats.createHeart(this.HEARTBEAT_INTERVAL);
      newHeartbeat = {
        last_beat_at: new Date,
        uuid: uuid,
        type: type
      };
      this.heartbeatService.create(newHeartbeat, function(error, heartbeat) {
        return console.log("People now know I am alive", heartbeat);
      });
      return heart.createEvent(this.HEARTBEAT_EVENT_INCREMENT, (function(_this) {
        return function(heartbeat, last) {
          _this.heartbeatService.find({
            uuid: uuid
          }, function(error, heartbeats) {
            if (!((error != null) || heartbeats.length === 0)) {
              return _this.heartbeatService.patch(heartbeats[0]._id, {
                last_beat_at: new Date
              }, function(error, heartbeat) {});
            } else {
              newHeartbeat = {
                last_beat_at: new Date,
                uuid: uuid,
                type: type
              };
              return _this.heartbeatService.create(newHeartbeat, function(error, heartbeat) {});
            }
          });
          return callback(null, heart);
        };
      })(this));
    };

    WorkerHeartbeat.prototype.findNextWorker = function(type, callback) {
      return this.heartbeatService.find({
        type: type
      }, function(error, heartbeats) {
        if (!((error != null) || heartbeats.length === 0)) {
          console.log("Next worker heartbeat is", heartbeats[0]);
          return callback(null, heartbeats[0]);
        } else {
          return callback("No worker found Alive");
        }
      });
    };

    WorkerHeartbeat.prototype.updateLastUsed = function(uuid, type, callback) {
      return this.heartbeatService.find({
        uuid: uuid
      }, (function(_this) {
        return function(error, heartbeats) {
          var newHeartbeat;
          if (!((error != null) || heartbeats.length === 0)) {
            return _this.heartbeatService.patch(heartbeats[0]._id, {
              last_used_at: new Date
            }, function(error, heartbeat) {
              return console.log("Last used updated", heartbeat);
            });
          } else {
            newHeartbeat = {
              last_beat_at: new Date,
              last_used_at: new Date,
              uuid: uuid,
              type: type
            };
            return _this.heartbeatService.create(newHeartbeat, function(error, heartbeat) {
              return console.log("Recreated with Last Used", heartbeat);
            });
          }
        };
      })(this));
    };

    return WorkerHeartbeat;

  })();

  module.exports = WorkerHeartbeat;

}).call(this);
