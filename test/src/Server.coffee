'use strict'

assert = require "assert"
Server = (require "../").Server

config = require "./config"

describe "Server", ->
  server = undefined

  beforeEach ->
    server = new Server config

  describe "Up and Running", ->
    it "make sure the server status is UP", (done) ->
      # Check for the server Status
      assert.equal server.getStatus() , "UP"
      done()