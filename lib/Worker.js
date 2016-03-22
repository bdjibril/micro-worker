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
    function Worker(config, workerType, nextWorkerType1, SYNC_ENDPOINT) {
      var address, socket;
      this.config = config;
      this.workerType = workerType;
      this.nextWorkerType = nextWorkerType1;
      this.SYNC_ENDPOINT = SYNC_ENDPOINT != null ? SYNC_ENDPOINT : "sync";
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
              var nextWorkerEndpoint;
              if (!error) {
                console.log(nextWorkerHeartbeat);
                nextWorkerEndpoint = _this.app.service(nextWorkerType);
                data.workerUuid = nextWorkerHeartbeat.uuid;
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
          syncResultObject = this.generateSyncResult(data, null);
          return this.syncEndpointService.create(syncResultObject, function(error, sync) {});
        }
      } else {
        syncResultObject = this.generateSyncResult(data, error);
        return this.syncEndpointService.create(syncResultObject, function(error, sync) {});
      }
    };

    return Worker;

  })();

  module.exports = Worker;

}).call(this);
