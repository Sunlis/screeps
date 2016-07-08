var idle = require('util.idle');
var creeputil = require('util.creep');

/**
 * Builder creep module.
 * @type {Object}
 */
var builder = {
    /**
     * A list of priority construction types. Builders will complete these first
     * before moving on to other construction sites.
     * @type {!Array<string>}
     */
    PRIORITY_SITES: [
        STRUCTURE_EXTENSION,
        STRUCTURE_CONTAINER,
    ],
    /**
     * Main run loop for builder creeps.
     * @param {!Creep}
     */
    run: function(creep) {
        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
        }
        var target;
        if (creep.memory.building) {
            target = [
                {
                    find: FIND_MY_CONSTRUCTION_SITES,
                    condition: function(target) {
                        return _.includes(
                            builder.PRIORITY_SITES, target.structureType);
                    },
                    sort: function(target) {
                        return target.progressTotal - target.progress;
                    },
                    action: 'build',
                },
                {
                    find: FIND_MY_CONSTRUCTION_SITES,
                    sort: function(target) {
                        return target.progressTotal - target.progress;
                    },
                    action: 'build',
                },
                {
                    find: FIND_STRUCTURES,
                    condition: function(target) {
                        return target.hits && target.hits < target.hitsMax;
                    },
                    sort: function(target) {
                        return target.hits;
                    },
                    action: 'repair',
                }
            ];
        } else {
            target = [
                {
                    find: FIND_SOURCES,
                    condition: function(target) {
                        return target.energy > 0;
                    },
                    sort: function(target) {
                        return creep.pos.getRangeTo(target);
                    },
                    action: 'harvest',
                },
            ];
        }

        creeputil.run(creep, {
            allowIdle: true,
            target: target
        }, builder);
    },
    /**
     * Build callback for creeputil. Attempts to build the provided target.
     * @param {!Creep} creep
     * @param {!ConstructionSite} target
     * @param {!Object} spec
     * @return {number} A constant from util.creep (eg. DONE, ERROR)
     */
    build: function(creep, target, spec) {
        var result = builder.checkResult_(creep.build(target));
        if (result) return result;

        if (creep.carry.energy == 0 ||
                target.progress == target.progressTotal) {
            return creeputil.DONE;
        }
        return creeputil.OK;
    },
    /**
     * Harvest callback for creeputil. Attempts to harvest the provided target.
     * @param {!Creep} creep
     * @param {!RoomObject} target
     * @param {!Object} spec
     * @return {number} A constant from util.creep (eg. DONE, ERROR)
     */
    harvest: function(creep, target, spec) {
        var result = builder.checkResult_(creep.harvest(target));
        if (result) return result;

        if (creep.carry.energy == creep.carryCapacity || target.energy == 0) {
            return creeputil.DONE;
        }
        return creeputil.OK;
    },
    /**
     * Repair callback for creeputil. Attempts to repair the provided target.
     * @param {!Creep} creep
     * @param {!RoomObject} target
     * @param {!Object} spec
     * @return {number} A constant from util.creep (eg. DONE, ERROR)
     */
    repair: function(creep, target, spec) {
        var result = builder.checkResult_(creep.repair(target));
        if (result) return result;

        if (creep.carry.energy == 0 || target.hits == target.hitsMax) {
            return creeputil.DONE;
        }
        return creeputil.OK;
    },

    checkResult_: function(result) {
        if (result == ERR_NOT_IN_RANGE) return creeputil.OUT_OF_RANGE;
        if (result != OK) return creeputil.ERROR;
        return null;
    },
};

module.exports = builder;