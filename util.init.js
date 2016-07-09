var find = require('util.find');

var init = {
    init: function() {
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                // console.log('Clearing non-existing creep memory:', name);
            }
        }
        init.checkSpawns();
    },
    checkSpawns: function() {
        var roles = [
            {
                name: 'harvester',
                count: 3,
                body: {
                    required: [WORK, MOVE, CARRY],
                    optional: [WORK, MOVE, CARRY],
                },
            },
            {
                name: 'builder',
                count: 2,
                body: {
                    required: [WORK, MOVE, CARRY],
                    optional: [WORK, MOVE],
                },
            },
            {
                name: 'guard',
                count: 2,
                // 80 + 50 + 50 + 10 + 10 = 200
                body: [ATTACK, MOVE, MOVE, TOUGH, TOUGH],
            },
            {
                name: 'harvester',
                count: 10,
                body: {
                    required: [WORK, MOVE, CARRY],
                    optional: [WORK, MOVE, CARRY],
                },
            },
            {
                name: 'repair',
                count: 2,
                body: {
                    required: [WORK, MOVE, CARRY],
                    optional: [MOVE],
                },
            },
        ];

        var counts = {};
        _.forEach(Game.creeps, function(creep) {
            if (counts[creep.memory.role]) counts[creep.memory.role]++;
            else counts[creep.memory.role] = 1;
        });

        for (var i in roles) {
            var role = roles[i];
            if (!counts[role.name]) counts[role.name] = 0;
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
        return _.reduce(body, function(sum, part) { return sum+BODYPART_COST[part]; }, 0);
    },
};

module.exports = init;
