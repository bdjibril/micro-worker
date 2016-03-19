'use strict'

assert = require "assert"
Sync = (require "../").Sync

config = require "./config"

describe "Sync", ->
  sync = undefined

  beforeEach ->
    sync = new Sync config, [], "entity"

  describe "Is Syncing", ->
    it "make sure the unimplemented function returns an error", (done) ->

      sync.findEntitiesToSync (err, result) ->
        assert.equal err , "UNIMPLEMENTED (findEntitiesToSync): This method needs to be implemented in the Subclass"
        done()