// logging-test.js
//
// Test the logging 
//
// Copyright 2012, E14N Inc.
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
    vows = require("vows"),
    Step = require("step"),
    stream = require("stream"),
    util = require("util"),
    Logger = require("bunyan");

var suite = vows.describe("schlock logging interface");

var StreamMock = function() {
    this.writable = true;
    this.callback = null;
    this.output = null;
};

util.inherits(StreamMock, stream.Stream);

StreamMock.prototype.write = function(data) {
    var cb;
    this.output = data;
    if (this.callback) {
	cb = this.callback;
	process.nextTick(function() {
	    cb(null, data);
	});
	this.callback = null;
    }
    return true;
};

StreamMock.prototype.end = function(data) {
    var cb;
    this.output = data;
    if (this.callback) {
	cb = this.callback;
	process.nextTick(function() {
	    cb(null, data);
	});
	this.callback = null;
    }
};

StreamMock.prototype.setCallback = function(callback) {
    var mock = this;
    mock.callback = callback;
};

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
		var str = new StreamMock(),
                    callback = this.callback,
                    log = new Logger({name: "schlock-test",
			              stream: str});

                callback(null, str, new Schlock(log)); 
            },
            "it works": function(err, str, schlock) {
                assert.ok(schlock);
            },
            "and we do a read lock": {
                topic: function(str, schlock) {
                    str.setCallback(this.callback);
                    schlock.readLock("target1", function(err) {});
                },
		"it writes to the log": function(err, written) {
		    assert.ifError(err);
		    assert.ok(written);
		},
		"and we do a read unlock": {
                    topic: function(written, str, schlock) {
                        str.setCallback(this.callback);
                        schlock.readUnlock("target1", function(err) {});
                    },
		    "it writes to the log": function(err, written) {
		        assert.ifError(err);
		        assert.ok(written);
		    }
		}
            },
            "and we do a write lock": {
                topic: function(str, schlock) {
                    str.setCallback(this.callback);
                    schlock.writeLock("target2", function(err) {});
                },
		"it writes to the log": function(err, written) {
		    assert.ifError(err);
		    assert.ok(written);
		},
		"and we do a write unlock": {
                    topic: function(written, str, schlock) {
                        str.setCallback(this.callback);
                        schlock.writeUnlock("target2", function(err) {});
                    },
		    "it writes to the log": function(err, written) {
		        assert.ifError(err);
		        assert.ok(written);
		    }
		}
            }
        }
    }
});

suite["export"](module);

