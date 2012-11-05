Schlock
-------

This is a poorly-crafted read-write lock system. It only works
in-process, and doesn't lock things between processes.

See also:

> http://en.wikipedia.org/wiki/Readers%E2%80%93writer_lock

License
=======

Copyright 2012, E14N Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

> http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Overview
========

The module exports a single constructor that I call `Schlock` but you might
want to call something smarter.

    var Schlock = require("schlock");
    
You need to create an instance to use it. I guess you could do this if
you had multiple sets of resources (files and cache elements, say)
that might share the same name.

    var fileSchlock = new Schlock();
    var cacheSchlock = new Schlock();

    // These won't block each other
    
    fileSchlock.writeLock("foo", ...);
    cacheSchlock.writeLock("foo", ...);
    
Once you have a schlock, you use the `readLock`, `writeLock`,
`readUnlock`, `writeUnlock` methods to manage resources.

Read-only access to resources is pretty straightforward.

    var fname = "/tmp/myfile.txt";
    
    fileSchlock.readLock(fname, function(err) {
        fs.readFile(fname, function(err, data) {
            fileSchlock.readUnlock(fname, function(err) {
            // do something with the data
            });
        });
    });

Read-write access is about the same:

    var fname = "/tmp/myfile.txt";
    
    fileSchlock.writeLock(fname, function(err) {
        fs.readFile(fname, function(err, data) {
            var newData = modify(data);
            fs.writeFile(fname, newData, function(err) {
                fileSchlock.writeUnlock(fname, function(err) {
                // do something with the data
                });
            });
        });
    });

I use [step](https://npmjs.org/package/step) to organize async stuff
so it'd look more like this for me:

    var fname = "/tmp/myfile.txt";

    Step(
        function() {
            fileSchlock.writeLock(fname, this);
        },
        function(err) {
            if (err) throw err;
            fs.readFile(fname, this);
        },
        function(err, data) {
            if (err) throw err;
            var newData = modify(data);
            fs.writeFile(fname, newData, this);
        },
        function(err) {
            if (err) throw err;
            fileSchlock.writeUnlock(fname, this);
        },
        function(err) {
            next(err);
        }
    );

...which is a little less crazy.

Multiple reads on the same resource can happen at the same time. Only
one write on the same resource can happen at one time, and no reads
can happen while the write is happening.

Writes get precedence to prevent starvation.

Filesystem
==========

I made this so I could do atomic-ish changes to files, but note that
it doesn't do `flock()` or any other operating-system-level locking
automatically. You still have to do that yourself.

API
===

* `new Schlock()`

Creates a new `Schlock`. Doesn't pay attention to any parameters.

* `readLock(name, callback)`

Lock the resource `name` for reading and call `callback`. The callback
takes a single parameter, an error.

If the resource is currently write-locked, the callback will be queued
to run once the write lock is unlocked.

* `readUnlock(name, callback)`

Unlock the resource `name` for reading and call `callback`. The
callback takes a single parameter, an error.

* `writeLock(name, callback)`

Lock the resource `name` for reading and call `callback`. The callback
takes a single parameter, an error.

If the resource is currently write-locked or read-locked, the callback
will be queued to run once the write lock is unlocked.

* `writeUnlock(name, callback)`

Unlock the resource `name` for writing and call `callback`. The
callback takes a single parameter, an error.
