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

var SchlockDoc = function() {
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
                writer = writeQueue.shift();
                writers++;
                runLater(writer);
            }
        } else {
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
        if (writers > 0 || writeQueue.length > 0) {
            readQueue.push(callback);
        } else {
            readers++;
            runLater(callback);
        }
    };

    this.writeLock = function(callback) {
        if (writers > 0 || readers > 0 || writeQueue.length > 0) {
            writeQueue.push(callback);
        } else {
            writers++;
            runLater(callback);
        }
    };

    this.readUnlock = function(callback) {

        if (readers > 0) {
            readers--;
        }

        runLater(callback);

        runNext();
    };

    this.writeUnlock = function(callback) {

        if (writers > 0) {
            writers--;
        }

        runLater(callback);

        runNext();
    };
};

var Schlock = function() {

    var that = this,
        docs = {};

    var getDoc = function(name) {

        if (!docs.hasOwnProperty(name)) {
            docs[name] = new SchlockDoc();
        }

        return docs[name];
    };

    var rmDoc = function(name) {
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
            rmDoc(name);
        }
    };

    this.writeUnlock = function(name, callback) {
        var sd = getDoc(name);
        sd.writeUnlock(callback);
        if (sd.idle()) {
            rmDoc(name);
        }
    };
};

module.exports = Schlock;
