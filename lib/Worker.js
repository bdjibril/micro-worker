(function() {
  var Worker, WorkerHeartbeat, _, common, feathers, io, uuid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  common = require("./common");

  feathers = require("feathers-client");

  io = require("socket.io-client");

  _ = require("underscore");

  uuid = require("node-uuid");

  WorkerHeartbeat = require("./WorkerHeartbeat");

  Worker = (function() {
    function Worker(config, workerType, nextWorkerType1, SYNC_ENDPOINT, SYNC_ENTITY, ENTITY_ENDPOINT) {
      var address, socket;
      this.config = config;
      this.workerType = workerType;
      this.nextWorkerType = nextWorkerType1;
      this.SYNC_ENDPOINT = SYNC_ENDPOINT != null ? SYNC_ENDPOINT : "sync";
      this.SYNC_ENTITY = SYNC_ENTITY != null ? SYNC_ENTITY : "entity";
      this.ENTITY_ENDPOINT = ENTITY_ENDPOINT != null ? ENTITY_ENDPOINT : "entities";
      this.goToNextStep = bind(this.goToNextStep, this);
      this.createListener = bind(this.createListener, this);
      address = this.config.serverUrl + ":" + this.config.serverPort;
      console.log("Worker Working with the sever at: ", address);
      this.workerHeartbeat = new WorkerHeartbeat(this.config);
      socket = io(address);
      this.app = (feathers(address)).configure(feathers.socketio(socket));
      this.workerUuid = uuid.v4();
      socket.on("connect", (function(_this) {
        return function() {
          console.log("Worker Connected. Type : " + _this.workerType + ", ID : " + _this.workerUuid);
          return socket.emit("registerworker", {
            type: _this.workerType,
            nextType: _this.nextWorkerType,
            uuid: _this.workerUuid
          });
        };
      })(this));
      this.createListener();
      this.syncEndpointService = this.app.service(this.SYNC_ENDPOINT);
    }

    Worker.prototype.createListener = function() {
      var doWork, goToNextStep, workerEndpoint, workerUuid;
      workerEndpoint = this.app.service(this.workerType);
      workerUuid = this.workerUuid;
      doWork = this.doWork;
      goToNextStep = this.goToNextStep;
      return workerEndpoint.on("created", (function(_this) {
        return function(data) {
          console.log("step created", data);
          if ((data.workerUuid != null) && data.workerUuid !== workerUuid) {
            console.log("Not my job", workerUuid, data.workerUuid);
            return;
          }
          _this.workerHeartbeat.updateLastUsed(workerUuid, _this.workerType, function(error, heartbeat) {
            if (!error) {
              return console.log("Updated Last used", heartbeat);
            }
          });
          return doWork(data, goToNextStep);
        };
      })(this));
    };

    Worker.prototype.doWork = function(data, callback) {
      var error;
      error = "UNIMPLEMENTED: Every Sub Class should implement their own dowork";
      console.log(error);
      return callback(error, data);
    };

    Worker.prototype.generateSyncResult = common.generateSyncResult;

    Worker.prototype.goToNextStep = function(error, data) {
      var nextWorkerType, syncResultObject;
      if (!error) {
        if ((this.nextWorkerType != null) || (data.nextWorkerType != null)) {
          nextWorkerType = data.nextWorkerType || this.nextWorkerType;
          return this.workerHeartbeat.findNextWorker(nextWorkerType, (function(_this) {
            return function(error, nextWorkerHeartbeat) {
              var entityEndpoint, nextWorkerEndpoint;
              if (!error) {
                console.log(nextWorkerHeartbeat);
                nextWorkerEndpoint = _this.app.service(nextWorkerType);
                data.workerUuid = nextWorkerHeartbeat.uuid;
                data.last_worked_on = (new Date).getTime();
                if (data[_this.SYNC_ENTITY]) {
                  data[_this.SYNC_ENTITY].last_worked_on = (new Date).getTime();
                  entityEndpoint = _this.app.service(_this.ENTITY_ENDPOINT);
                  entityEndpoint.patch(data[_this.SYNC_ENTITY]._id, {
                    last_worked_on: data[_this.SYNC_ENTITY].last_worked_on
                  }, function(error, result) {
                    if (!error) {
                      return console.log("Success pathing the last_worked_on for  ", result);
                    }
                  });
                } else {
                  Object.keys(data).forEach(function(key) {
                    var e, ref, type, value;
                    value = data[key];
                    type = Array.isArray(value) ? "array" : typeof value;
                    if (type === "object") {
                      data[key].last_worked_on = (new Date).getTime();
                    }
                    if (((ref = data[key]) != null ? ref._id : void 0) != null) {
                      try {
                        entityEndpoint = _this.app.service(key + "s");
                        return entityEndpoint.patch(data[key]._id, {
                          last_worked_on: data[key].last_worked_on
                        }, function(error, result) {
                          if (!error) {
                            return console.log("Success pathing the last_worked_on for  ", result);
                          }
                        });
                      } catch (_error) {
                        e = _error;
                        return console.log(e);
                      }
                    }
                  });
                }
                return nextWorkerEndpoint.create(data, function(error, result) {
                  if (!error) {
                    return console.log("Success creating work for  ", result);
                  }
                });
              }
            };
          })(this));
        } else {
          console.log("This was the last step of the flow. Nothing to do with", data);
          syncResultObject = this.generateSyncResult(data, this.workerType, null);
          return this.syncEndpointService.create(syncResultObject, function(error, sync) {});
        }
      } else {
        syncResultObject = this.generateSyncResult(data, this.workerType, error);
        return this.syncEndpointService.create(syncResultObject, function(error, sync) {});
      }
    };

    return Worker;

  })();

  module.exports = Worker;

}).call(this);
