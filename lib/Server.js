(function() {
  var Server, WorkerHeartbeat, bodyParser, db, dbHooks, feathers, hooks, memory, socketio;

  feathers = require("feathers");

  hooks = require("feathers-hooks");

  bodyParser = require("body-parser");

  db = require("feathers-nedb");

  memory = require("feathers-memory");

  socketio = feathers.socketio;

  dbHooks = require("./hooks");

  WorkerHeartbeat = require("./WorkerHeartbeat");

  Server = (function() {
    function Server(config, baseDir, endpointHooks) {
      var address, app, endpointKey, endpointValue, epHook, ref, workerHeartbeat;
      if (baseDir == null) {
        baseDir = "";
      }
      this.status = "DOWN";
      address = config.serverUrl + ":" + config.serverPort;
      workerHeartbeat = new WorkerHeartbeat(config);
      app = feathers().configure(feathers.rest()).configure(socketio(function(io) {
        return io.on("connection", function(socket) {
          var wInfo;
          console.log("Conected event from the server");
          wInfo = null;
          return socket.on("registerworker", function(workerInfo) {
            wInfo = workerInfo;
            wInfo.socketId = socket.id;
            console.log("Registering worker", wInfo);
            workerHeartbeat.createHeartbeats(wInfo, function(err, result) {
              if (!err) {
                return console.log(result);
              }
            });
            return socket.on("disconnect", function() {
              console.log("Disconnecting worker", wInfo);
              return workerHeartbeat.deregisterWorkerHeartBeat(wInfo.uuid, function(err, result) {
                if (!err) {
                  return console.log(result);
                }
              });
            });
          });
        });
      })).configure(hooks()).use(bodyParser.json()).use("/heartbeat", memory("heartbeat"));
      (app.service("heartbeat")).before({
        create: dbHooks.heartbeatHooks.before.create,
        find: dbHooks.heartbeatHooks.before.find
      }).after({
        find: dbHooks.heartbeatHooks.after.find
      });
      ref = config.endpoint;
      for (endpointKey in ref) {
        endpointValue = ref[endpointKey];
        app.use("/" + endpointValue, db(endpointValue));
        epHook = (endpointHooks != null) && (endpointHooks[endpointKey] != null) ? endpointHooks[endpointKey] : dbHooks.genericHooks;
        (app.service(endpointValue)).before({
          create: epHook.before.create,
          find: epHook.before.find
        }).after({
          find: epHook.after.find
        });
      }
      app.use("/", feathers["static"](baseDir + "/" + (config.staticPath || 'ui')));
      app.listen(config.serverPort);
      console.log("Server is now listening on port " + config.serverPort);
      this.status = "UP";
    }

    Server.prototype.getStatus = function() {
      return this.status;
    };

    module.exports = Server;

    return Server;

  })();

}).call(this);
