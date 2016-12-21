# Micro Workers
<div align="center">


<br/>
<b>M</b>(icro) <b>W</b>(orkers)
<br/><br/>

 <a href="https://www.bithound.io/github/bdjibril/micro-worker">
 <img src="https://www.bithound.io/github/bdjibril/micro-worker/badges/score.svg" alt="bitHound Score">
</a>

<a href="https://www.npmjs.com/package/micro-worker">
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dt/micro-worker.svg?style=flat-square"/>
</a>

<a href="https://travis-ci.org/bdjibril/micro-worker">
  <img src="https://travis-ci.org/bdjibril/micro-worker.svg?branch=master" alt="Build Status"/>
</a>

<a href="https://github.com/bdjibril/micro-worker/blob/master/LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT licensed"/>
</a>

<br/>
<br/>
</div>
This repository contains a framework that helps create `scalable` and `inter-connected` nodejs `microservices`.

[![NPM](https://nodei.co/npm/micro-worker.png)](https://nodei.co/npm/micro-worker/)

## Installation
```bash
  npm install micro-workers --save
```

## Diagram
[![Diagram](https://cdn.rawgit.com/bdjibril/micro-worker/master/assets/Worker%20Plateform%20Diagram.svg)](https://cdn.rawgit.com/bdjibril/micro-worker/master/assets/Worker%20Plateform%20Diagram.svg)

## Usage
Most of the classes require a configuration object containing the server information, as well as the endpoints. This can be created on the fly inside of your programs or passed in as a module.

> This might be a good place to store other application settings as well

#### Anatomy of a config file
 
```coffeescript
config =
  serverUrl: "http://localhost"
  serverPort: 3000
  staticPath: "www"
  endpoint:
    sampleEndpoint: "sampleendpoint"

# if the config is inside its own file then we need to export it as a module
module.exports = config
```

### Create a server

A **Server** is required for the framework to work. The Server class does not need to be extended to be customized and should be used directly. only One instance of the server should be used per application.
Prior to creating a server all the endpoints needed should be identified and added to the **config.endpoint** object as key/value properties
 
```coffeescript
Server = require("micro-worker").Server

# Create Custome hooks if necessary
# A Hook will automatically be applied to the Endpoint with the same name
# example sampleEndpoint endpoint will apply to config.endpoint.sampleEndpoint
sampleHooks =
  sampleEndpoint
    before:
      create: (hook, next) ->
        # Add the created_at date
        hook.data.created_at = new Date
        # Go to the next step (save to database)
        next()
        
      find: (hook, next) ->
        # Sort the result list by created_at date
        hook.params.query.$sort =
          last_sync_at: 1
          created_at: -1
        next()

    after:
      find: (hook, next) ->
        size = hook.result.length
        # Only  the last 10
        if size >= 10
          hook.result = hook.result.slice(size - 10, size)
        next()

# Start a new Instance of your class to run the worker
config = require "./config"
new Server config, sampleHooks
```

### Create a Listener
A **Listener** is just a class that will listen to a particular endpoint for events (created, updated, patched, and removed) and take some action.
On a "user" endpoint for example this would be used to send an email to the user every time the user is created (in the **created function**)
```coffeescript
Listener = require("micro-worker").Listener

class SampleListener extends Litener
  
  # Call the super class with config and endpoint
  constructor: (@config, @endpoint)->
    super @config, @endpoint

  created: (data) ->
    console.log "created: ", data

  updated: (data) ->
    console.log "updated: ", data

  patched: (data) ->
    console.log "patched: ", data

  removed: (data) ->
    console.log "removed: ", data
    

# Start a new Instance of your class to run the Listener
config = require "./config"
endpoint = "sampleendpoint"
new SampleListener config, endpoint
```

### Create a worker
A worker class makes it easy to execute a sequence of task in a distributed maner. It helps the developer only focus on the application logic by supplying only the items below.

* a **config**: a configuration object
* the **workerType**: the name for the current worker so it can be referenced by other workers
* a **nextWorkerType**: the name for the next worker in the flow that will exicute the next task. This can be set to null and can be dynamically set from whitin the **doWork** function; the data returned by that function would just need to have a property named "**nextWorkerType**"
* the **doWork** function: this is where your app logic and focus will be

```coffeescript
Worker = require("micro-worker").Worker

class SampleWorker extends Worker
  
  constructor: (@config)->
    @workerType = "sampleworker"
    @nextWorkerType = "nextworker"
    syncEndpoint = "sync"

    # Call the super class with workerType, nextWorkerType, syncEndpoint arguents
    super @config, @workerType, @nextWorkerType, syncEndpoint

  doWork: (number, callback) ->
    resultDataForNextWorker = Math.sin number
    if isNaN resultDataForNextWorker
      error = "The result is not a number"
    else
      error = null
    callback err, resultDataForNextWorker

# Start a new Instance of your class to run the worker
config = require "./config"
new SampleWorker config
```

### Create a sync
Knowing how unstable applications might become some times due to external dependancies (rest, databses ...), a Sync class would be used to periodically check for discrepancies between an application and the external system it works with and automatically fix them.
For example a Sync would automatically retry an api call once the API server comes back online.

```coffeescript

Sync = require("micro-worker").Sync

# Just an example check function that checks if the number passed in is equal to 50
checkIfNumberIs50 = (number, callback) ->
    if number is 50
      error = null
    else
      error = "The number #{numeber} value isn't 50"
      console.log error

    callback error, number
        
class SampleSync extends Sync
  
  constructor: (@config)->
    # syncChecks is an array of all the check functions
    syncChecks = [checkIfNumberIs50]
    syncEndpoint = "sync"
    entityEndpoint = "sampleentity"

    # call the super class with syncChecks, entityEndpoint, fixErrors, syncEndpoint, syncEntityName (optional), syncInterval(optional) arguments
    super @config, syncChecks, entityEndpoint, true, syncEndpoint, "data", 30000
    
  # Finding all the entities to work with
  findEntitiesToSync: (callback) ->
    # Syncing some numbers
    callback null, [10, 20, 30, 40]

  fixEntity: (entity, callback) ->
    # For example our fix is to increment the number
    entity++
    callback null, entity
    
# Start a new Instance of your to run the sync
config = require "./config"
new SampleSync config
```

## Tests
```bash
npm test
```

## Release History
* 0.1.24 If a worker does not explicitly specify the ENTITY_ENDPOINT we will construct it from the nested object key name and will update the entity on the server
* 0.1.23 Fixed Bug in 0.1.22
* 0.1.22 update the `last_worked_on` for the nested entity as well (Deprecated Bug)
* 0.1.21 Compiled js for latest Changes in 0.1.20
* 0.1.20 Update the `last_worked_on` when a worker gets an entity
* 0.1.19 Now only sync entities where the last_sync is overdue per the sync interval
         Added async as an explicit dependency
         Display the sync entity name in the logs 
* 0.1.18 Added async as an explicit dependency
* 0.1.17 Added fethers-hooks as an explicit dependency
* 0.1.14 - 0.1.16 Documentation Updates
* 0.1.13 Sync Module fixes (Cleanup)
* 0.1.12 Made the Sync Module stable
* 0.1.11 Performance Improvements : **The workers get registered and unregistered in realtime using sockets connect and disconnect events as opposed to the timed heartbeat mechanism used before**
* 0.1.7 Bug fixes for **Cannot read property 'updateLastUsed' of undefined**
* 0.1.6 Listerner class improvements
* 0.1.5 Added the endpoint listerner class
* 0.1.4 Need to use v4 UUID instead of v1 so improve uniqueness
* 0.1.3 heattbeat fixes
* 0.1.2 Fixed the bugs about endpoints not starting and also the base path
* 0.1.1 Fixed the heartbeat and worker log(working with Server at) to avoid confusion
* 0.1.0 Initial release
