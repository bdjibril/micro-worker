(function() {
  'use strict';
  var Listener, assert, config;

  assert = require("assert");

  Listener = (require("../")).Listener;

  config = require("./config");

  describe("Listener", function() {
    var listener;
    listener = void 0;
    beforeEach(function() {
      return listener = new Listener(config, "sampleendpoint");
    });
    return describe("Listening to endpoint", function() {
      it("make sure the listener has the correct endpoint", function(done) {
        assert.equal(listener.endpoint, "sampleendpoint");
        return done();
      });
      return it("make sure the unimplemented listeners call cause error message", function(done) {
        listener.created();
        assert.equal(listener.error, "UNIMPLEMENTED: Every Sub Class should implement their own created");
        return done();
      });
    });
  });

}).call(this);
