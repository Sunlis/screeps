var creeputil = require('util.creep');

var repair = {
    run: function(creep) {
        creeputil.run(creep, {
            allowIdle: true,
            //verbose: true,
            target: [
                {
                    find: FIND_SOURCES,
                    condition: function(target) {
                        return creep.carry.energy < creep.carryCapacity;
                    },
                    action: 'harvest',
                },
                {
                    find: FIND_STRUCTURES,
                    condition: function(target) {
                        return creep.carry.energy > 0 &&
                            target.structureType != STRUCTURE_ROAD &&
                            target.hits < target.hitsMax;
                    },
                    sort: function(target) {
                        return target.hits;
                    },
                    action: 'repair',
                },
                // {
                //     find: FIND_STRUCTURES,
                //     condition: function(target) {
                //         if (target.structureType == STRUCTURE_ROAD) return false;
                //         return creep.carry.energy > 0 && target.hits < target.hitsMax/10;
                //     },
                //     action: 'repair',
                // },
                // {
                //     find: FIND_STRUCTURES,
                //     condition: function(target) {
                //         if (target.structureType == STRUCTURE_ROAD) return false;
                //         return creep.carry.energy > 0 && target.hits < target.hitsMax/2;
                //     },
                //     action: 'repair',
                // },
                // {
                //     find: FIND_STRUCTURES,
                //     condition: function(target) {
                //         if (target.structureType == STRUCTURE_ROAD) return false;
                //         return creep.carry.energy > 0 && target.hits < target.hitsMax;
                //     },
                //     action: 'repair',
                // },
            ]
        }, repair);
    },
    harvest: function(creep, target, spec) {
        var result = creep.harvest(target);
        if (result != OK) {
            return creeputil.ERROR;
        }
        if (creep.carry.energy == creep.carryCapacity || target.energy == 0) {
            return creeputil.DONE;
        }
    },
    repair: function(creep, target, spec) {
        var result = creep.repair(target);
        if (result != OK) {
            return creeputil.ERROR;
        }
        if (target.hits == target.hitsMax || creep.carry.energy == 0) {
            return creeputil.DONE;
        }
    },
};

module.exports = repair;