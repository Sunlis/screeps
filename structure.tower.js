
var tower = {
  run: function(tow) {
    return tower.attackHostile(tow) || tower.healFriendly(tow) || tower.repairFriendly(tow);
  },
  attackHostile: function(tow) {
    var hostile = [
      FIND_HOSTILE_CREEPS,
      FIND_HOSTILE_STRUCTURES,
      FIND_HOSTILE_SPAWNS,
      FIND_HOSTILE_CONSTRUCTION_SITES,
    ];
    for (var i in hostile) {
      var type = hostile[i];
      var targets = tow.room.find(type);
      targets = _.sortBy(targets, function(target) {
        return target.hits;
      });
      if (targets.length) {
        tow.attack(targets[0]);
        return true;
      }
    }
    return false;
  },
  healFriendly: function(tow) {
    var targets = tow.room.find(FIND_MY_CREEPS);
    targets = _.sortBy(targets, function(creep) {
      return creep.hits;
    });
    if (targets.length) {
      tow.heal(targets[0]);
      return true;
    }
    return false;
  },
  repairFriendly: function(tow) {
    var targets = tow.room.find(FIND_STRUCTURES);
    targets = _.sortBy(targets, function(structure) {
      return structure.hits;
    });
    if (targets.length) {
      tow.repair(targets[0);
      return true;
    }
    return false;
  },
};

module.exports = tower;
