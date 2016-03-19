(function() {
  var Server, bodyParser, db, dbHooks, feathers, hooks;

  feathers = require("feathers");

  hooks = require("feathers-hooks");

  bodyParser = require("body-parser");

  db = require("feathers-nedb");

  dbHooks = require("./hooks");

  Server = (function() {
    function Server(config, baseDir, endpointHooks) {
      var address, app, endpointKey, endpointValue, epHook, ref;
      if (baseDir == null) {
        baseDir = "";
      }
      this.status = "DOWN";
      address = config.serverUrl + ":" + config.serverPort;
      app = feathers().configure(feathers.rest()).configure(feathers.socketio()).configure(hooks()).use(bodyParser.json()).use("/heartbeat", db("heartbeat"));
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
