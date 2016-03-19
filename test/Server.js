(function() {
  'use strict';
  var Server, assert, config;

  assert = require("assert");

  Server = (require("../")).Server;

  config = require("./config");

  describe("Server", function() {
    var server;
    server = void 0;
    beforeEach(function() {
      return server = new Server(config);
    });
    return describe("Up and Running", function() {
      return it("make sure the server status is UP", function(done) {
        assert.equal(server.getStatus(), "UP");
        return done();
      });
    });
  });

}).call(this);
