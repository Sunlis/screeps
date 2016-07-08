var find = require('util.find');
var idle = require('util.idle');

var creeputil = {
    log: function(creep, options, message) {
        if (options.verbose) {
            console.log(creep.name, '-', message);
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
                    creeputil.log(creep, options, 'found new target');
                    creep.memory.target = result.target;
                    creep.memory.targetSpec = result.spec;
                }
            }
        } else if (options.allowIdle) {
            creeputil.log(creep, options, 'no target spec - idling');
            return idle(creep);
        }
        if (!creep.memory.path) {
            var result = creeputil.path_(creep, options);
            if (result) {
                creeputil.log(creep, options, 'found new path');
                creep.memory.path = result.path;
            }
        }
        if (!creep.memory.target || !creep.memory.path) {
            creeputil.log(creep, options, 'missing target or path - idling');
            return idle(creep);
        }
        if (!creeputil.action_(creep, options, module)) {
            creeputil.log(creep, options, 'action failed - idling');
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
                creeputil.log(creep, options, 'found target with rule ' + i);
                return {
                    target: match[0],
                    spec: spec,
                };
            }
        }
        return false;
    },
    path_: function(creep, options) {
        if (!creep.memory.target) return false;
        var target = Game.getObjectById(creep.memory.target.id);
        if (!target) {
            creeputil.clear_(creep);
            return;
        }
        return {
            path: creep.room.findPath(
                creep.pos, target.pos, creep.memory.targetSpec.pathOpts),
        };
    },
    action_: function(creep, options, module) {
        if (!creep.memory.target) return false;
        var spec = creep.memory.targetSpec;
        var target = Game.getObjectById(creep.memory.target.id);
        if (creep.memory.path && creep.memory.path.length) {
            var move = creep.move(creep.memory.path[0].direction);
            if (move == OK) {
                creep.memory.path.shift();
            } else if (move != ERR_BUSY && move != ERR_TIRED) {
                creep.memory.path = null;
            } else {
                creeputil.log(creep, options, 'move result: ' + move);
            }
            if (options.recalcPath) {
                creep.memory.path = null;
            }
        }
        if ((!creep.memory.path || creep.memory.path.length == 0) && spec && spec.action) {
            var result = module[spec.action](creep, target, spec);
            if (result == creeputil.DONE) {
                creeputil.clear_(creep);
                creeputil.log(creep, options, 'action done');
            } else if (result == creeputil.ERROR) {
                creeputil.clear_(creep);
                creeputil.log(creep, options, 'action error - clear');
            }
        } else {
            creeputil.log(creep, options, JSON.stringify(spec));
            if (!spec) {
                creeputil.log(creep, options, 'missing spec, clearing memory');
            } else if (!spec.action) {
                creeputil.log(creep, options, 'missing spec.action, clearing memory');
            }
            creeputil.clear_(creep);
        }
        return true;
    },
    clear_: function(creep) {
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