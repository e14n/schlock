// schlock-test.js
//
// Test the schlock module
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

var assert = require("assert"),
    vows = require("vows");

var suite = vows.describe("schlock module");

suite.addBatch({
    "When we require the module": {
        topic: function() {
            return require("../lib/schlock");
        },
        "it works": function(Schlock) {
            assert.ok(Schlock);
        },
        "it returns the Schlock class": function(Schlock) {
            assert.isFunction(Schlock);
        },
        "and we create a new Schlock": {
            topic: function(Schlock) {
                return new Schlock();
            },
            "it has a readLock() method": function(schlock) {
                assert.isFunction(schlock.readLock);
            },
            "it has a writeLock() method": function(schlock) {
                assert.isFunction(schlock.writeLock);
            },
            "it has a readUnlock() method": function(schlock) {
                assert.isFunction(schlock.readUnlock);
            },
            "it has a writeUnlock() method": function(schlock) {
                assert.isFunction(schlock.writeUnlock);
            }
        }
    }
});

suite["export"](module);
