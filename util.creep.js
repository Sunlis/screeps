var find = require('util.find');
var idle = require('util.idle');

var creeputil = {
    log: function(creep, options, message) {
        if (options.verbose) {
            console.log(creep.name, '-', message);
            creep.say(message);
        }
    },
    /**
     * @param {!Creep} creep
     * @param {Object<string, *>} options
     */
    run: function(creep, options, module) {
        if (options.target) {
            if (!creep.memory.target) {
                var result = creeputil.target_(creep, options);
                if (result) {
                    creeputil.log(creep, options, 'new target');
                    creep.memory.target = result.target;
                    creep.memory.targetSpec = result.spec;
                }
            }
        } else if (options.allowIdle) {
            creeputil.log(creep, options, 'no spec');
            return idle(creep);
        }
        if (!creep.memory.path) {
            var result = creeputil.path_(creep, options);
            if (result) {
                creeputil.log(creep, options, 'new path');
                creep.memory.path = result.path;
            }
        }
        if (!creep.memory.target || !creep.memory.path) {
            creeputil.log(creep, options, 'no tar/path');
            return idle(creep);
        }
        if (!creeputil.action_(creep, options, module)) {
            creeputil.log(creep, options, 'action fail');
            return idle(creep);
        }
    },
    /**
     * @param {!Creep} creep
     * @param {Object<string, *>} options
     */
    target_: function(creep, options) {
        for (var i in options.target) {
            var list = [];
            var spec = options.target[i];
            if (spec.find) {
                list = creep.room.find(spec.find);
            } else if (spec.from) {
                list = spec.from;
            }
            var match = list;
            if (spec.condition) match = _.filter(match, spec.condition);
            if (spec.sort) match = _.sortBy(match, spec.sort);
            if (match.length) {
                creeputil.log(creep, options, 'new tar ' + i);
                return {
                    target: match[0].id,
                    spec: spec,
                };
            }
        }
        return false;
    },
    path_: function(creep, options) {
        if (!creep.memory.target) return false;
        var target = Game.getObjectById(creep.memory.target);
        if (!target) {
            creeputil.log(creep, options, 'clearing for missing/invalid target in path search');
            creeputil.clear_(creep, options);
            return;
        }
        return {
            path: Room.serializePath(creep.room.findPath(
                creep.pos, target.pos, creep.memory.targetSpec.pathOpts)),
        };
    },
    action_: function(creep, options, module) {
        if (!creep.memory.target) return false;
        var spec = creep.memory.targetSpec;
        var target = Game.getObjectById(creep.memory.target);
        if (creep.memory.path) {
            if (!(creep.memory.path instanceof String)) {
                creeputil.log(creep, options, 'clearing for malformed path');
                creeputil.clear_(creep, options);
                return;
            }
            var path = Room.deserializePath(creep.memory.path);
            var move = creep.move(path[0].direction);
            if (move == OK) {
                path.shift();
                if (path.length == 0) {
                    creep.memory.path = null;
                } else {
                    creep.memory.path = Room.serializePath(path);
                }
            } else if (move != ERR_BUSY && move != ERR_TIRED) {
                creep.memory.path = null;
            } else {
                creeputil.log(creep, options, 'move: ' + move);
            }
            if (options.recalcPath) {
                creep.memory.path = null;
            }
        }
        if ((!creep.memory.path || creep.memory.path.length == 0) && spec && spec.action) {
            var result = module[spec.action](creep, target, spec);
            if (result == creeputil.DONE) {
                creeputil.log(creep, options, 'clearing for finished creep action');
                creeputil.clear_(creep, options);
                creeputil.log(creep, options, 'action done');
            } else if (result == creeputil.ERROR) {
                creeputil.log(creep, options, 'clearing for creep action error');
                creeputil.clear_(creep, options);
                creeputil.log(creep, options, 'action error');
            }
        } else {
            if (!spec) {
                creeputil.log(creep, options, 'no spec');
            } else if (!spec.action) {
                creeputil.log(creep, options, 'no spec.action');
            }
            creeputil.log(creep, options, 'clearing for bad creep spec');
            creeputil.clear_(creep, options);
        }
        return true;
    },
    clear_: function(creep, options) {
        creep.memory.target = null;
        creep.memory.targetSpec = null;
        creep.memory.path = null;
    },

    DONE: 0,
    ERROR: 1,
};

module.exports = creeputil;

/*

{
    target: [
        {
            find: FIND_* constant,
            from: eg. Game.spawns,
            condition: function(obj, creep) { return obj.isGood(); },
            findOpts: { filter: function(obj){ return obj.needsWhatever(); } },
            pathOpts: Room.findPath opts,
            action: function(creep, target, spec) { creep.harvest(); return done; }
        }
    ]
}

*/