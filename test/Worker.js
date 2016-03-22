(function() {
  'use strict';
  var UUID_REGEX, Worker, assert, config;

  assert = require("assert");

  Worker = (require("../")).Worker;

  config = require("./config");

  UUID_REGEX = /.{0,}-.{0,}-.{0,}-.{0,}-.{0,}/;

  describe("Worker", function() {
    var worker;
    worker = void 0;
    beforeEach(function() {
      return worker = new Worker(config, "workerType", "nextworkerType");
    });
    return describe("Is alive and Working", function() {
      return it("makes sure the worker has a UUID ", function(done) {
        assert.equal(UUID_REGEX.test(worker.workerUuid), true);
        return setTimeout(function() {
          return done();
        }, 1000);
      });
    });
  });

}).call(this);
