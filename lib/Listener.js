(function() {
  var Listener, feathers, io;

  feathers = require("feathers-client");

  io = require("socket.io-client");

  Listener = (function() {
    function Listener(config, endpoint) {
      var address, endpointService, socket;
      this.config = config;
      this.endpoint = endpoint;
      address = this.config.serverUrl + ":" + this.config.serverPort;
      console.log("Listener Working with the sever at: ", address);
      socket = io(address);
      this.app = (feathers(address)).configure(feathers.socketio(socket));
      endpointService = this.app.service(this.endpoint);
      endpointService.on("created", this.created);
      endpointService.on("updated", this.updated);
      endpointService.on("patched", this.patched);
      endpointService.on("removed", this.removed);
    }

    Listener.prototype.created = function(data) {
      this.error = "UNIMPLEMENTED: Every Sub Class should implement their own created";
      return console.log(this.error);
    };

    Listener.prototype.updated = function(data) {
      this.error = "UNIMPLEMENTED: Every Sub Class should implement their own updated";
      return console.log(this.error);
    };

    Listener.prototype.patched = function(data) {
      this.error = "UNIMPLEMENTED: Every Sub Class should implement their own patched";
      return console.log(this.error);
    };

    Listener.prototype.removed = function(data) {
      this.error = "UNIMPLEMENTED: Every Sub Class should implement their own removed";
      return console.log(this.error);
    };

    return Listener;

  })();

  module.exports = Listener;

}).call(this);
