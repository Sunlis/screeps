var idle = require('util.idle');
var find = require('util.find');

var harvester = {
    /** @param {!Creep} */
    run: function(creep) {
        harvester.target_(creep);
        harvester.path_(creep);
        harvester.action_(creep);
    },
    target_: function(creep) {
        if (creep.memory.target == null) {
            creep.memory.path = null;
            if (creep.carry.energy == 0) {
                var sources = creep.room.find(FIND_SOURCES);
                var target = _.reduce(creep.room.find(FIND_SOURCES), function(result, source) {
                    if (source.energy == 0) return result;
                    if (!result) return source;
                    if (creep.pos.getRangeTo(source) < creep.pos.getRangeTo(result)) {
                        return source;
                    }
                    return result;
                }, null);
                if (target) {
                    creep.memory.target = target;
                    return true;
                }
            } else {
                var target;
                var destinations = creep.room.find(FIND_STRUCTURES);
                var priorities = {};
                priorities[STRUCTURE_CONTAINER] = 0;
                priorities[STRUCTURE_EXTENSION] = 1;
                priorities[STRUCTURE_SPAWN] = 2;
                priorities[STRUCTURE_CONTROLLER] = 3;
                priorities[STRUCTURE_TOWER] = 4;
                destinations = _.sortBy(destinations, function(dest) {
                    return priorities[dest.structureType];
                });
                for (var type in priorities) {
                    var options = _.filter(destinations, function(dest) {
                        if (dest.structureType == type) {
                            if (type == STRUCTURE_CONTAINER) {
                                return _.sum(dest.store) < dest.storeCapacity;
                            } else {
                                return !dest.energyCapacity ||
                                    dest.energy < dest.energyCapacity;
                            }
                        }
                        return false;
                    });
                    options = _.sortBy(options, function(dest) {
                        var obj = Game.getObjectById(dest);
                        return -creep.pos.getRangeTo(obj);
                    });
                    if (options.length) {
                        target = options[0];
                        break;
                    }
                }
                if (target) {
                    creep.memory.target = target;
                    return true;
                }
            }
        }
        return false;
    },
    path_: function(creep) {
        if (creep.memory.target != null && creep.memory.path == null) {
            creep.memory.path = creep.room.findPath(
                creep.pos, creep.memory.target.pos,
                {
                    maxOps: 1000,
                    maxRooms: 9,
                });
        }
    },
    action_: function(creep) {
        if (!creep.memory.target || !creep.memory.path) {
            return idle(creep);
        } else if (creep.memory.path.length) {
            if (creep.move(creep.memory.path[0].direction) == OK) {
                creep.memory.path.shift();
            }
        } else {
            var target = Game.getObjectById(creep.memory.target.id);
            if (target instanceof Source) {
                if (creep.harvest(target) != OK ||
                        creep.carry.energy == creep.carryCapacity ||
                        target.energy == 0) {
                    creep.memory.target = null;
                    creep.memory.path = null;
                }
            } else if (target instanceof Structure) {
                var result = creep.transfer(target, RESOURCE_ENERGY);
                if (result != OK || creep.carry.energy == 0 ||
                        (target.energyCapacity && target.energy == target.energyCapacity)) {
                    creep.memory.target = null;
                    creep.memory.path = null;
                }
            }
        }
    },

    getBuildSpec: function(counts) {
        return {
            name: 'harvester',
            count: (counts['builder'] < 2 || counts['guard'] < 1) ? 2 : 6,
            body: {
                required: [WORK, MOVE, CARRY],
                optional: [WORK, WORK, CARRY],
            },
        };
    },
};

module.exports = harvester;
