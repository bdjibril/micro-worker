'use strict'

assert = require "assert"
WorkerHeartbeat = require "../lib/WorkerHeartbeat"

config = require "./config"

describe "WorkerHeartbeat", ->
  heart = undefined
  workerHeartbeat = undefined
  uuid = "937972-35-25-345325"
  type = "genericWorker"

  return

  beforeEach ->
    workerHeartbeat = new WorkerHeartbeat config

    workerHeartbeat.beginLife type, uuid, (error, h) ->
      unless error
        heart = h

  describe "listen", ->
    it "makes sure the worker heart is beating by checking its age", (done) ->
      # Kill the heart afer 1 sec
      setTimeout ->
        assert.equal heart.age , 1
        heart.kill()
        done()
      , 1000