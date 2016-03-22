(function() {
  var WorkerHeartbeat, feathers, io,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  feathers = require("feathers-client");

  io = require("socket.io-client");

  WorkerHeartbeat = (function() {
    function WorkerHeartbeat(config) {
      var address, app, socket;
      this.config = config;
      this.deregisterWorkerHeartBeat = bind(this.deregisterWorkerHeartBeat, this);
      this.updateLastUsed = bind(this.updateLastUsed, this);
      address = this.config.serverUrl + ":" + this.config.serverPort;
      console.log("Heartbeat Working with the sever at: ", address);
      socket = io(address);
      app = (feathers(address)).configure(feathers.socketio(socket));
      this.heartbeatService = app.service("heartbeat");
    }

    WorkerHeartbeat.prototype.createHeartbeats = function(heartbeat, callback) {
      return this.heartbeatService.create(heartbeat, function(error, heartbeat) {
        if (!error) {
          return callback(null, "Success regigistering heartbeat, for uuid: " + heartbeat.uuid + " ");
        } else {
          return console.log(error);
        }
      });
    };

    WorkerHeartbeat.prototype.findNextWorker = function(type, callback) {
      return this.heartbeatService.find({
        type: type,
        $limit: 1
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
        uuid: uuid,
        $limit: 1
      }, (function(_this) {
        return function(error, heartbeats) {
          var dt;
          dt = new Date;
          if (!((error != null) || heartbeats.length === 0)) {
            return _this.heartbeatService.patch(heartbeats[0]._id || heartbeats[0].id, {
              last_used_at: dt
            }, function(error, heartbeat) {
              return console.log("Last used updated", heartbeat);
            });
          }
        };
      })(this));
    };

    WorkerHeartbeat.prototype.deregisterWorkerHeartBeat = function(uuid, callback) {
      return this.heartbeatService.find({
        uuid: uuid
      }, (function(_this) {
        return function(error, heartbeats) {
          if (!((error != null) || heartbeats.length === 0)) {
            return _this.heartbeatService.remove(heartbeats[0]._id || heartbeats[0].id, null, function(error) {
              if (error) {
                return callback("error while unregistering the workerHeartbeat " + error);
              } else {
                return callback(null, "Successfully Unregistered the heartbeat for uuid: " + uuid);
              }
            });
          } else {
            console.log("heartbeat not found", error, heartbeats, uuid);
            return callback("heartbeat not found", heartbeats);
          }
        };
      })(this));
    };

    return WorkerHeartbeat;

  })();

  module.exports = WorkerHeartbeat;

}).call(this);
