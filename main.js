var harvester = require('role.harvester');
var builder = require('role.builder');
var repair = require('role.repair');
var guard = require('role.guard');
var init = require('util.init');
var roads = require('util.roads');
var tower = require('structure.tower');

module.exports.loop = function() {
    init.init();
    roads.monitor();
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (!creep.memory.role) {
            console.log('Creep', name ,'has no role!');
            continue;
        }
       // var start = performance.now();
        switch (creep.memory.role) {
            case 'harvester':
                harvester.run(creep); break;
            case 'builder':
                builder.run(creep); break;
            case 'repair':
                repair.run(creep); break;
            case 'guard':
                guard.run(creep); break;
            default:
                console.log('Unkown creep type:', creep.memory.role);
        }
        //console.log(creep.name, performance.now() - start);
    }
    for (var name in Game.structures) {
        var struct = Game.structures[name];
        var obj = Game.getObjectById(struct.id);
        if (struct.structureType == STRUCTURE_TOWER && obj.my) {
            tower.run(obj);
        }
    }
    roads.maybeBuild();
};
