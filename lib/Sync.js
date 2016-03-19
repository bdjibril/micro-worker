(function() {
  var Sync, _, async, common, feathers, io,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  common = require("./common");

  feathers = require("feathers-client");

  io = require("socket.io-client");

  async = require("async");

  _ = require("underscore");

  Sync = (function() {
    function Sync(config, syncChecks, entityEndpoint, fix, SYNC_ENDPOINT, SYNC_INTERVAL, CONCURRENT_SYNC) {
      var address, socket;
      this.config = config;
      this.syncChecks = syncChecks;
      this.entityEndpoint = entityEndpoint;
      this.fix = fix != null ? fix : true;
      this.SYNC_ENDPOINT = SYNC_ENDPOINT != null ? SYNC_ENDPOINT : "sync";
      this.SYNC_INTERVAL = SYNC_INTERVAL != null ? SYNC_INTERVAL : 10000;
      this.CONCURRENT_SYNC = CONCURRENT_SYNC != null ? CONCURRENT_SYNC : 10;
      this.syncCallback = bind(this.syncCallback, this);
      this.syncEntity = bind(this.syncEntity, this);
      this.handleEntitiesFound = bind(this.handleEntitiesFound, this);
      this.startSync = bind(this.startSync, this);
      address = this.config.serverUrl + ":" + this.config.serverPort;
      console.log("Sync Working with the sever at: ", address);
      socket = io(address);
      this.app = (feathers(address)).configure(feathers.socketio(socket));
      this.entitySyncEndpointService = this.app.service(this.SYNC_ENDPOINT);
      this.entityEndpointService = this.app.service(this.entityEndpoint);
      setTimeout(this.startSync, this.SYNC_INTERVAL);
    }

    Sync.prototype.startSync = function() {
      console.log("Sync started");
      return this.findEntitiesToSync(this.handleEntitiesFound);
    };

    Sync.prototype.handleEntitiesFound = function(error, entities) {
      var startSyncFunc, syncInterval;
      if (error || entities.length === 0) {
        console.log("No SYNCABLE entities found will not attempt any sync");
        return setTimeout(this.startSync, this.SYNC_INTERVAL);
      } else {
        startSyncFunc = this.startSync;
        syncInterval = this.SYNC_INTERVAL;
        return async.eachLimit(entities, this.CONCURRENT_SYNC, this.syncEntity, function(err) {
          if (err) {
            console.log("Some entities did not Go trough all the tests.", err);
          } else {
            console.log("All entities Went trough all the tests.");
          }
          return setTimeout(startSyncFunc, syncInterval);
        });
      }
    };

    Sync.prototype.syncEntity = function(entity, callback) {
      var entityEndpointService, i, len, ref, syncCb, updateLastSync, wFunction, waterFallFunctions;
      entityEndpointService = this.entityEndpointService;
      updateLastSync = function(innerCallback) {
        return entityEndpointService.find({
          _id: entity._id
        }, function(error, matchingEntities) {
          if (!((error != null) || matchingEntities.length === 0)) {
            return entityEndpointService.patch(matchingEntities[0]._id, {
              last_sync_at: new Date
            }, function(error, updatedEntity) {
              if (!error) {
                return innerCallback(null, updatedEntity);
              }
            });
          }
        });
      };
      waterFallFunctions = [updateLastSync];
      ref = this.syncChecks;
      for (i = 0, len = ref.length; i < len; i++) {
        wFunction = ref[i];
        waterFallFunctions.push(wFunction);
      }
      syncCb = this.syncCallback;
      return async.waterfall(waterFallFunctions, function(error, result) {
        return syncCb(error, result, callback);
      });
    };

    Sync.prototype.syncCallback = function(err, entity, callback) {
      var returnError, syncResultObject;
      returnError = null;
      if (err) {
        console.log(err);
        returnError = err;
        if (this.fix) {
          this.fixEntity(entity, function(err, result) {
            if (err) {
              return console.log("Error while creating the fix", err);
            } else {
              return console.log("Successfully created the fix", result);
            }
          });
        }
      }
      syncResultObject = this.generateSyncResult({
        device: entity
      }, returnError);
      return this.entitySyncEndpointService.create(syncResultObject, function(error, sync) {
        if (error) {
          return callback(error);
        } else {
          return callback(null, sync);
        }
      });
    };

    Sync.prototype.generateSyncResult = common.generateSyncResult;

    Sync.prototype.findEntitiesToSync = function(callback) {
      return callback("UNIMPLEMENTED (findEntitiesToSync): This method needs to be implemented in the Sync Subclass");
    };

    Sync.prototype.fixEntity = function(entity, callback) {
      return callback("UNIMPLEMENTED (fixEntity): This method needs to be implemented in the Sync Subclass", entity);
    };

    return Sync;

  })();

  module.exports = Sync;

}).call(this);
