(function() {
  'use strict';
  var Sync, assert, config;

  assert = require("assert");

  Sync = (require("../")).Sync;

  config = require("./config");

  describe("Sync", function() {
    var sync;
    sync = void 0;
    beforeEach(function() {
      return sync = new Sync(config, [], "entity");
    });
    return describe("Is Syncing", function() {
      return it("make sure the unimplemented function returns an error", function(done) {
        return sync.findEntitiesToSync(function(err, result) {
          assert.equal(err, "UNIMPLEMENTED (findEntitiesToSync): This method needs to be implemented in the Subclass");
          return done();
        });
      });
    });
  });

}).call(this);
