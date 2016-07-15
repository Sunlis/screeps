var util = {};
util.creep = require('util.creep');
util.contract = require('util.contract');

var tanker = {
  run: function(creep) {
    if (creep.memory.state != 'fill' && creep.carry.energy == 0) {
      creep.memory.state = 'fill';
    } else if (creep.memory.state == 'fill' &&
        creep.carry.energy == creep.carryCapacity) {
      creep.memory.state = 'deliver';
    }
    var targets = [];
    if (creep.memory.state == 'fill') {
      if (!creep.memory.target) {
        var promise = util.creep.getResourcePromise(
            creep, RESOURCE_ENERGY, creep.carryCapacity);
        if (promise) {
          targets = [
            {
              from: _.map([promise.from], Game.getObjectById),
              action: 'collect',
            }
          ];
        }
      }
    } else {
      if (!creep.memory.target) {
        var promise = util.creep.offerResource(
            creep, RESOURCE_ENERGY, creep.carry.energy);
        if (promise) {
          targets = [
            {
              from: _.map([promise.to], Game.getObjectById),
              action: 'deliver',
            }
          ];
        }
      }
    }

    util.creep.run(creep, {
      allowIdle: true,
      target: targets,
    }, tanker);
  },

  collect: function(creep, target, spec) {
    var result = creep.withdraw(target, RESOURCE_ENERGY);
    if (creep.carry.energy == creep.energyCapacity ||
        target.store.energy == 0) {
      util.contract.breakAll(util.contract.getTo(creep));
      return util.creep.DONE;
    }
    switch (result) {
      case OK:
        return util.creep.OK;
      case ERR_NOT_ENOUGH_RESOURCES:
        util.contract.breakAll(util.contract.getTo(creep));
      case ERR_INVALID_TARGET:
      case ERR_FULL:
      case ERR_INVALID_ARGS:
        return util.creep.ERROR;
      case ERR_NOT_IN_RANGE:
        return util.creep.OUT_OF_RANGE;
    }
  },

  deliver: function(creep, target, spec) {
    var result = creep.transfer(target, RESOURCE_ENERGY);
    if (creep.carry.energy == 0 || target.energy == target.energyCapacity) {
      util.contract.breakAll(util.contract.getFrom(creep));
      return util.creep.DONE;
    }
    switch (result) {
      case OK:
        return util.creep.OK;
      case ERR_NOT_ENOUGH_RESOURCES:
        util.contract.breakAll(util.contract.getFrom(creep));
      case ERR_INVALID_TARGET:
      case ERR_FULL:
      case ERR_NOT_OWNER:
      case ERR_INVALID_ARGS:
        return util.creep.ERROR;
      case ERR_NOT_IN_RANGE:
        return util.creep.OUT_OF_RANGE;
    }
  },

  getBuildSpec: function() {
    return {
      name: 'tanker',
      count: 6,
      body: {
        required: [WORK, MOVE, CARRY],
        optional: [WORK, MOVE, CARRY, CARRY],
      },
    };
  },
};

module.exports = tanker;
