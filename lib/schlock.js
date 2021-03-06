// schlock.js
//
// Cheaply-made in-process lock broker
// 
// Copyright 2012, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var SchlockDoc = function(name, log) {

    var readers    = 0,
        writers    = 0,
        readQueue  = [],
        writeQueue = [];

    var runLater = function(runme) {
        process.nextTick(function() {
            runme(null);
        });
    };

    var runNext = function() {

        var writer,
            reader;

        // XXX: assert(writers === 0);

        if (writeQueue.length > 0) {
            if (readers === 0) {
                if (log) log.info("Running queued writer for " + name);
                writer = writeQueue.shift();
                writers++;
                runLater(writer);
            }
        } else if (readQueue.length > 0) {
            if (log) log.info("Running " + readQueue.length + " queued reader(s) for " + name);
            while (readQueue.length > 0) {
                reader = readQueue.shift();
                readers++;
                runLater(reader);
            }
        }
    };

    this.idle = function() {
        return (readers === 0 &&
                writers === 0 &&
                readQueue.length === 0 &&
                writeQueue.length === 0);
    };

    this.readLock = function(callback) {
        if (log) log.info("Read lock request for " + name);
        if (writers > 0 || writeQueue.length > 0) {
            if (log) log.info("Queueing reader for " + name);
            readQueue.push(callback);
        } else {
            if (log) log.info("Running reader immediately for " + name);
            readers++;
            runLater(callback);
        }
    };

    this.writeLock = function(callback) {
        if (log) log.info("Write lock request for " + name);
        if (writers > 0 || readers > 0 || writeQueue.length > 0) {
            if (log) log.info("Queueing writer for " + name);
            writeQueue.push(callback);
        } else {
            if (log) log.info("Running writer immediately for " + name);
            writers++;
            runLater(callback);
        }
    };

    this.readUnlock = function(callback) {

        if (log) log.info("Read unlock request for " + name);

        if (readers > 0) {
            if (log) log.info("Decrementing readers for " + name);
            readers--;
        }

        runLater(callback);

        runNext();
    };

    this.writeUnlock = function(callback) {

        if (log) log.info("Write unlock request for " + name);

        if (writers > 0) {
            if (log) log.info("Decrementing writers for " + name);
            writers--;
        }

        runLater(callback);

        runNext();
    };
};

var Schlock = function(logParent) {

    var that = this,
        docs = {},
        log = (logParent) ? logParent.child({component: "schlock"}) : null;

    var getDoc = function(name) {

        if (log) log.info("Getting lock record for " + name);

        if (!docs.hasOwnProperty(name)) {
            if (log) log.info("New lock record for " + name);
            docs[name] = new SchlockDoc(name, log);
        }

        return docs[name];
    };

    var rmDoc = function(name) {
        if (log) log.info("Removing lock record for " + name);
        delete docs[name];
    };

    this.readLock = function(name, callback) {
        var sd = getDoc(name);
        sd.readLock(callback);
    };

    this.writeLock = function(name, callback) {
        var sd = getDoc(name);
        sd.writeLock(callback);
    };

    this.readUnlock = function(name, callback) {
        var sd = getDoc(name);
        sd.readUnlock(callback);
        if (sd.idle()) {
            if (log) log.info("Lock record idle for " + name);
            rmDoc(name);
        }
    };

    this.writeUnlock = function(name, callback) {
        var sd = getDoc(name);
        sd.writeUnlock(callback);
        if (sd.idle()) {
            if (log) log.info("Lock record idle for " + name);
            rmDoc(name);
        }
    };
};

module.exports = Schlock;
