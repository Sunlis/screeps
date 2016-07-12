var find = require('util.find');
var contract = require('util.contract');
var roles = require('roles');

var init = {
    init: function() {
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                if (Memory.creeps[name].promises) {
                    contract.breakAll(Memory.creeps[name].promises);
                }
                delete Memory.creeps[name];
                // console.log('Clearing non-existing creep memory:', name);
            }
        }
        init.checkSpawns();
    },
    checkSpawns: function() {
        var counts = {};
        for (var type in roles) {
            counts[type] = 0;
        }
        _.forEach(Game.creeps, function(creep) {
            counts[creep.memory.role]++;
        });

        var types = _.map(roles, function(type) {
            return type.getBuildSpec(counts);
        });

        for (var i in types) {
            var role = types[i];
            if (counts[role.name] < role.count) {
                var body = init.getBody_(Game.spawns.Spawn1, role);
                var num = 1;
                do {
                    var result = Game.spawns.Spawn1.createCreep(
                        body,
                        role.name + '_' + num,
                        {role: role.name});
                    num++;
                } while (result == ERR_NAME_EXISTS);
                break;
            }
        }
    },
   getBody_: function(spawn, role) {
       if (role.body instanceof Array) {
           return role.body;
       }
        var big = role.body.required.concat(role.body.optional);
        var small = role.body.required;
        var body;
        if (spawn.room.energyCapacityAvailable >= init.creepCost_(big)) {
            body = big;
        } else {
            body = small;
        }
        return body;
    },
    creepCost_: function(body) {
        return _.reduce(body, function(sum, part) {
            return sum + BODYPART_COST[part];
        }, 0);
    },
};

module.exports = init;
