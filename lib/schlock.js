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

var Schlock = function() {
    this.docs = {};
};

var SchlockDoc = function() {
    this.readers    = 0;
    this.writers    = 0;
    this.readQueue  = [];
    this.writeQueue = [];
};

Schlock.prototype.getDoc = function(name) {

    if (!this.docs.hasOwnProperty(name)) {
        this.docs[name] = new SchlockDoc();
    }

    return this.docs[name];
};

Schlock.prototype.readLock = function(name, callback) {
    var sd = this.getDoc(name);
    if (sd.writers > 0) {
        sd.readQueue.push(callback);
    } else {
        sd.readers++;
        process.nextTick(function() {
            callback(null);
        });
    }
};

Schlock.prototype.writeLock = function(name, callback) {
    var sd = this.getDoc(name);
    if (sd.writers > 0 || sd.readers > 0) {
        sd.writeQueue.push(callback);
    } else {
        sd.writers++;
        process.nextTick(function() {
            callback(null);
        });
    }
};

Schlock.prototype.readUnlock = function(name, callback) {

    var writer,
        reader,
        sd = this.getDoc(name);

    if (sd.readers > 0) {
        sd.readers--;
    }

    if (sd.writeQueue.length > 0) {
        writer = sd.writeQueue.unshift();
        sd.writers++;
        process.nextTick(function() {
            writer(null);
        });
    } else {
        while (sd.readQueue.length > 0) {
            reader = sd.readQueue.unshift();
            sd.readers++;
            process.nextTick(function() {
                reader(null);
            });
        }
    }

    process.nextTick(function() {
        callback(null);
    });
};

Schlock.prototype.writeUnlock = function(name, callback) {

    var writer,
        reader,
        sd = this.getDoc(name);

    if (sd.writers > 0) {
        sd.writers--;
    }

    if (sd.writeQueue.length > 0) {
        writer = sd.writeQueue.unshift();
        sd.writers++;
        process.nextTick(function() {
            writer(null);
        });
    } else {
        while (sd.readQueue.length > 0) {
            reader = sd.readQueue.unshift();
            sd.readers++;
            process.nextTick(function() {
                reader(null);
            });
        }
    }

    process.nextTick(function() {
        callback(null);
    });
};

module.exports = Schlock;
