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
                var destinations = creep.room.find(FIND_MY_STRUCTURES);
                for (var i = 0; i < destinations.length; i++) {
                    var base = destinations[i];
                    var dest = Game.getObjectById(base.id);
                    if (dest instanceof StructureExtension &&
                            dest.energy < dest.energyCapacity) {
                        target = base;
                        break;
                    } else if (dest instanceof StructureTower) {
                        target = base;
                        break;
                    } else if (dest instanceof StructureSpawn &&
                            dest.energy < dest.energyCapacity) {
                        target = base;
                    } else if (dest instanceof StructureContainer &&
                            dest.energy < dest.energyCapacity) {
                        target = base;
                    } else if (dest instanceof StructureController && !target) {
                        target = base;
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
                var amount = creep.carry.energy;
                if (target.energyCapacity && target.energyCapacity - target.energy < amount) {
                    amount = target.energyCapacity - target.energy;
                }
                var result = creep.transfer(target, RESOURCE_ENERGY, amount);
                if (result != OK || creep.carry.energy == 0 ||
                        (target.energyCapacity && target.energy == target.energyCapacity)) {
                    creep.memory.target = null;
                    creep.memory.path = null;
                }
            }
        }
    },
};

module.exports = harvester;
