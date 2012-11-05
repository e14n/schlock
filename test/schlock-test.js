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
    vows = require("vows"),
    Step = require("step");

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
            },
            "and we readLock a resource": {
                topic: function(schlock) {
                    var resource1 = 42,
                        value,
                        callback = this.callback;

                    Step(
                        function() {
                            schlock.readLock("resource1", this);
                        },
                        function(err) {
                            if (err) throw err;
                            value = resource1;
                            schlock.readUnlock("resource1", this);
                        },
                        function(err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, value);
                            }
                        }
                    );
                },
                "it works": function(err, value) {
                    assert.ifError(err);
                    assert.equal(value, 42);
                }
            },
            "and we writeLock a resource": {
                topic: function(schlock) {
                    var resource2 = 23,
                        value,
                        callback = this.callback;

                    Step(
                        function() {
                            schlock.writeLock("resource2", this);
                        },
                        function(err) {
                            if (err) throw err;
                            resource2 = 16;
                            value = resource2;
                            schlock.writeUnlock("resource2", this);
                        },
                        function(err) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, value);
                            }
                        }
                    );
                },
                "it works": function(err, value) {
                    assert.ifError(err);
                    assert.equal(value, 16);
                }
            },
            "and we readLock a resource multiple times": {
                topic: function(schlock) {
                    var callback = this.callback,
                        resource3 = 15;

                    Step(
                        function() {
                            var i,
                                group = this.group(),
                                reader = function(cb) {
                                    return function(err) {
                                        var value;
                                        if (err) {
                                            cb(err, null);
                                        } else {
                                            value = resource3;
                                            schlock.readUnlock("resource3", function(err) {
                                                if (err) {
                                                    cb(err, null);
                                                } else {
                                                    cb(null, value);
                                                }
                                            });
                                        }
                                    };
                                };

                            for (i = 0; i < 10; i++) {
                                schlock.readLock("resource3", reader(group()));
                            }
                        },
                        function(err, results) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, results);
                            }
                        }
                    );
                },
                "it works": function(err, results) {
                    var i;
                    assert.ifError(err);
                    assert.isArray(results);
                    assert.lengthOf(results, 10);
                    for (i = 0; i < 10; i++) {
                        assert.equal(results[i], 15);
                    }
                }
            },
            "and we do a writer between readers": {
                topic: function(schlock) {
                    var callback = this.callback,
                        resource4 = 8;

                    Step(
                        function() {
                            var i,
                                group = this.group(),
                                reader = function(cb) {
                                    var value;
                                    return function(err) {
                                        if (err) {
                                            cb(err, null);
                                        } else {
                                            value = resource4;
                                            schlock.readUnlock("resource4", function(err) {
                                                if (err) {
                                                    cb(err, null);
                                                } else {
                                                    cb(null, value);
                                                }
                                            });
                                        }
                                    };
                                },
                                writer = function(cb) {
                                    var value;
                                    return function(err) {
                                        if (err) {
                                            cb(err, null);
                                        } else {
                                            resource4 = 4;
                                            value = resource4;
                                            schlock.writeUnlock("resource4", function(err) {
                                                if (err) {
                                                    cb(err, null);
                                                } else {
                                                    cb(null, value);
                                                }
                                            });
                                        }
                                    };
                                };

                            for (i = 0; i < 10; i++) {
                                schlock.readLock("resource4", reader(group()));
                            }

                            schlock.writeLock("resource4", writer(group()));

                            for (i = 11; i < 21; i++) {
                                schlock.readLock("resource4", reader(group()));
                            }
                        },
                        function(err, results) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, results);
                            }
                        }
                    );
                },
                "it works": function(err, results) {
                    var i;
                    assert.ifError(err);
                    assert.isArray(results);
                    assert.lengthOf(results, 21);
                    for (i = 0; i < 10; i++) {
                        assert.equal(results[i], 8);
                    }
                    assert.equal(results[10], 4);
                    for (i = 11; i < 21; i++) {
                        assert.equal(results[i], 4);
                    }
                }
            }
        }
    }
});

suite["export"](module);
