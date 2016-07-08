var idle = require('util.idle');
var creeputil = require('util.creep');

var builder = {
    /** @param {!Creep} */
    run: function(creep) {
        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
        }
        creeputil.run(creep, {
            allowIdle: true,
            verbose: true,
            target: [
                {
                    find: FIND_SOURCES,
                    condition: function(target) {
                        return !creep.memory.building && target.energy > 0;
                    },
                    sort: function(target) {
                        return creep.pos.getRangeTo(target);
                    },
                    action: 'harvest',
                },
                {
                    find: FIND_MY_CONSTRUCTION_SITES,
                    condition: function(target) {
                        return creep.memory.building &&
                            target.structureType == STRUCTURE_EXTENSION;
                    },
                    sort: function(target) {
                        return target.progressTotal - target.progress;
                    },
                    action: 'build',
                },
                {
                    find: FIND_MY_CONSTRUCTION_SITES,
                    condition: function(target) {
                        return creep.memory.building;
                    },
                    sort: function(target) {
                        return target.progressTotal - target.progress;
                    },
                    action: 'build',
                },
                {
                    find: FIND_STRUCTURES,
                    condition: function(target) {
                        return creep.memory.building &&
                            target.hits &&
                            target.hits < target.hitsMax;
                    },
                    sort: function(target) {
                        return target.hits;
                    },
                    action: 'repair',
                },
            ]
        }, builder);
        return;
    },
    build: function(creep, target, spec) {
        var result = creep.build(target);
        if (result != OK) {
            return creeputil.ERROR;
        }
        if (creep.carry.energy == 0 || target.progress == target.progressTotal) {
            return creeputil.DONE;
        }
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
        if (creep.carry.energy == 0 || target.hits == target.hitsMax) {
            return creeputil.DONE;
        }
    },
};

module.exports = builder;