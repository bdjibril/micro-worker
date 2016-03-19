(function() {
  'use strict';
  var WorkerHeartbeat, assert, config;

  assert = require("assert");

  WorkerHeartbeat = require("../lib/WorkerHeartbeat");

  config = require("./config");

  describe("WorkerHeartbeat", function() {
    var heart, type, uuid, workerHeartbeat;
    heart = void 0;
    workerHeartbeat = void 0;
    uuid = "937972-35-25-345325";
    type = "genericWorker";
    beforeEach(function() {
      workerHeartbeat = new WorkerHeartbeat(config);
      return workerHeartbeat.beginLife(type, uuid, function(error, h) {
        if (!error) {
          return heart = h;
        }
      });
    });
    return describe("listen", function() {
      return it("makes sure the worker heart is beating by checking its age", function(done) {
        return setTimeout(function() {
          assert.equal(heart.age, 1);
          heart.kill();
          return done();
        }, 1000);
      });
    });
  });

}).call(this);
