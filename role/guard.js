var creeputil = require('util.creep');

var guard = {
    run: function(creep) {
        creeputil.run(creep, {
            allowIdle: true,
            recalcPath: true,
            target: [
                {
                    find: FIND_HOSTILE_CREEPS,
                    action: 'attack'
                },
                {
                    find: FIND_HOSTILE_STRUCTURES,
                    action: 'attack'
                },
                {
                    find: FIND_HOSTILE_CONSTRUCTION_SITES,
                    action: 'attack'
                },
                {
                    find: FIND_HOSTILE_SPAWNS,
                    action: 'attack'
                },
            ],
        }, guard);
    },
    attack: function(creep, target, spec) {
        creep.attack(target);
        if (!target || target.hits == 0) {
            return creeputil.DONE;
        }
    },
};

module.exports = guard;