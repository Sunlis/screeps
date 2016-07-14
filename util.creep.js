var find = require('util.find');
var idle = require('util.idle');
var contract = require('util.contract');

/**
 * Generic framework for creep targetting, pathfinding, and actions.
 * @type {Object}
 */
var creeputil = {
    /**
     * Logs a message to the console if `verbose` is enabled in the options.
     * @param {!Creep} creep
     * @param {!Object} options
     * @param {string} message
     * @param {*} opt_obj
     */
    log: function(creep, options, message, opt_obj) {
        if (options.verbose) {
            console.log(creep.name, '-', message);
            if (opt_obj) {
                console.log(message, JSON.stringify(opt_obj));
                console.log(message, opt_obj);
            }
            creep.say(message);
        }
    },
    /**
     * Main run loop for a creep.
     * @param {!Creep} creep
     * @param {Object<string, *>} options
     * @param {Object} module The creep spec containing the action callbacks.
     */
    run: function(creep, options, module) {
        if (options.target) {
            if (!creep.memory.target) {
                var result = creeputil.target_(creep, options);
                if (result) {
                    creeputil.log(creep, options, 'new target', result);
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
     * Finds a new target for the creep.
     * @param {!Creep} creep
     * @param {Object<string, *>} options
     * @return {boolean|Object} An object containing a target ID and spec.
     * @private
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
    /**
     * Finds a new path for the creep.
     * @param {!Creep} creep
     * @param {Object<string, *>} options
     * @return {boolean|Object} An object containing a serialized path.
     * @private
     */
    path_: function(creep, options) {
        if (!creep.memory.target) return false;
        var target = Game.getObjectById(creep.memory.target);
        if (!target) {
            creeputil.log(
                creep, options,
                'clearing for missing/invalid target in path search');
            creeputil.clear_(creep);
            return false;
        }
        var path = creep.pos.findPathTo(
            target, creep.memory.targetSpec.pathOpts);
        var serialized = Room.serializePath(path);
        return {
            path: serialized,
        };
    },
    /**
     * Runs a creep's actions (move + build/repair/etc).
     * @param {!Creep} creep
     * @param {Object<string, *>} options
     * @param {Object} module The creep spec containing the action callbacks.
     * @return {boolean}
     * @private
     */
    action_: function(creep, options, module) {
        if (!creep.memory.target) return false;
        var spec = creep.memory.targetSpec;
        var target = Game.getObjectById(creep.memory.target);
        if (creep.memory.path && creep.memory.path != '') {
            if (typeof(creep.memory.path) != 'string') {
                creeputil.log(
                    creep, options,
                    'clearing for malformed path',
                    creep.memory.path);
                creeputil.clear_(creep);
                return false;
            }
            try {
                var path = Room.deserializePath(creep.memory.path);
            } catch(e) {
                creeputil.log(creep, options, 'bad path', creep.memory);
                creeputil.clear_(creep);
                return false;
            }
            var move = creep.moveByPath(path);
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
        if (!spec || !spec.action) {
            if (!spec) {
                creeputil.log(creep, options, 'no spec');
            } else if (!spec.action) {
                creeputil.log(creep, options, 'no spec.action');
            }
            creeputil.log(creep, options, 'clearing for bad creep spec', spec);
            creeputil.clear_(creep);
        } else {
            var result = module[spec.action](creep, target, spec);
            if (result == creeputil.OK) {
                creep.memory.path = _.padLeft(creep.pos.x, 2, '0') +
                    _.padLeft(creep.pos.y, 2, '0');

            } else if (result == creeputil.DONE) {
                creeputil.log(creep, options, 'clearing for finished creep action');
                creeputil.clear_(creep);
                creeputil.log(creep, options, 'action done');
            } else if (result == creeputil.ERROR) {
                creeputil.log(creep, options, 'clearing for creep action error');
                creeputil.clear_(creep);
                creeputil.log(creep, options, 'action error');
            } else {
                // all good - creep will keep performing action
            }
        }
        return true;
    },
    /**
     * Clears the creep's memory of target/path information.
     * @param {!Creep} creep
     * @private
     */
    clear_: function(creep) {
        creep.memory.target = null;
        creep.memory.targetSpec = null;
        creep.memory.path = null;
    },

    /**
     * Get a promise for a resource from a structure or creep.
     * TODO: From creeps, maybe?
     *
     * @param {!Creep} creep
     * @param {string} resource A RESOURCE_* constant
     * @param {number} amount
     * @return {?contract}
     */
    getResourcePromise: function(creep, resource, amount) {
        var sources = creep.room.find(FIND_STRUCTURES);
        sources = _.filter(sources, function(source) {
            if (source.structureType == STRUCTURE_CONTAINER &&
                    source.store[resource] >= amount) {
                var promised = contract.getPromised(source, resource);
                return source.store[resource] - promised >= amount;
            }
            return false;
        });
        if (sources.length) {
            sources = _.sortBy(sources, function(source) {
                return -creep.pos.getRangeTo(source);
            });
            var source = sources[0];
            return contract.swear(source, creep, resource, amount);
        }
        return null;
    },

    /**
     * Offer a resource to a structure.
     *
     * @param {!Creep} creep
     * @param {string} resource A RESOURCE_* constant
     * @param {number} amount
     * @return {?contract}
     */
    offerResource: function(creep, resource, amount) {
        var targetPriorities = {};
        targetPriorities[STRUCTURE_EXTENSION] = 0;
        targetPriorities[STRUCTURE_SPAWN] = 1;
        targetPriorities[STRUCTURE_TOWER] = 2;
        targetPriorities[STRUCTURE_CONTROLLER] = 3;
        targetPriorities[STRUCTURE_CONTAINER] = 4;

        var targets = creep.room.find(FIND_STRUCTURES);
        for (var type in targetPriorities) {
            var options = _.filter(targets, function(target) {
                var pass = (target.structureType == type &&
                    creeputil.roomForResource_(target, resource, amount, true));
                if (pass && target.structureType == STRUCTURE_TOWER) {
                    return target.energy < (target.energyCapacity / 2);
                }
                return pass;
            });
            options = _.sortBy(options, function(target) {
                return creep.pos.getRangeTo(target);
            });
            if (options.length) {
                return contract.swear(creep, options[0], resource, amount);
            }
        }
        // targets = _.filter(targets, function(target) {
        //     if (!creeputil.roomForResource_(target, resource, amount)) {
        //         return false;
        //     }
        //     if (targetPriorities[target.structureType] == undefined) {
        //         return false;
        //     }
        //     return true;
        // });
        // targets = _.sortBy(targets, function(target) {
        //     return targetPriorities[target.structureType];
        // });
        // if (targets.length) {
        //     var target = targets[0];
        //     return contract.swear(creep, target, resource, amount);
        // }
        return null;
    },

    roomForResource_: function(target, resource, amount, limitTowers) {
        var promised = contract.getPromised(target);
        switch (target.structureType) {
            case STRUCTURE_CONTAINER:
                var total = _.sum(target.store) + contract.getPromised(target);
                return total < target.storeCapacity;
            case STRUCTURE_TOWER:
                if (limitTowers) {
                    return resource == RESOURCE_ENERGY &&
                        target.energy < (target.energyCapacity / 2);
                }
            case STRUCTURE_SPAWN:
            case STRUCTURE_EXTENSION:
                return resource == RESOURCE_ENERGY &&
                    target.energy < target.energyCapacity;
            case STRUCTURE_CONTROLLER:
                return resource == RESOURCE_ENERGY;
            default:
                return false;
        }
    },

    DONE: 0,
    ERROR: 1,
    OK: 2,
    OUT_OF_RANGE: 3,

    CODE_MAP: {
        0: 'DONE',
        1: 'ERROR',
        2: 'OK',
        3: 'OUT_OF_RANGE',
    },
};

module.exports = creeputil;

/*

{
    target: [
        {
            find: FIND_* constant,
            from: eg. Game.spawns,
            condition: function(obj) { return obj.isGood(); },
            sort: function(obj) { return obj.index; },
            findOpts: { filter: function(obj){ return obj.needsWhatever(); } },
            pathOpts: Room.findPath opts,
            action: 'harvest', //module.harvest()
        }
    ]
}

*/
