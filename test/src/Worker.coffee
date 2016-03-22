'use strict'

assert = require "assert"
Worker = (require "../").Worker

config = require "./config"

UUID_REGEX = /.{0,}-.{0,}-.{0,}-.{0,}-.{0,}/

describe "Worker", ->
  worker = undefined

  beforeEach ->
    worker = new Worker config, "workerType", "nextworkerType"

  describe "Is alive and Working", ->
    it "makes sure the worker has a UUID ", (done) ->
      assert.equal UUID_REGEX.test(worker.workerUuid) , true

      # delay the done wo that we can se server logs
      setTimeout(() ->
        done()
      , 1000)