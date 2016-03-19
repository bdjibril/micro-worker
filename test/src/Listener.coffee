'use strict'

assert = require "assert"
Listener = (require "../").Listener

config = require "./config"

describe "Listener", ->
  listener = undefined

  beforeEach ->
    listener = new Listener config, "sampleendpoint"

  describe "Listening to endpoint", ->
    it "make sure the listener has the correct endpoint", (done) ->
      # Check for the endpoint
      assert.equal listener.endpoint , "sampleendpoint"
      done()

    it "make sure the unimplemented listeners call cause error message", (done) ->
      # Check for the endpoint
      listener.created()
      assert.equal listener.error , "UNIMPLEMENTED: Every Sub Class should implement their own created"
      done()