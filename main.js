var util = {};
util.init = require('util.init');
util.roads = require('util.roads');
var roles = require('roles');
var structure = {};
structure.tower = require('structure.tower');

module.exports.loop = function() {
    util.init.init();
    util.roads.monitor();
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (!creep.memory.role) {
            console.log('Creep', name ,'has no role!');
            continue;
        }
        if (roles[creep.memory.role]) {
            roles[creep.memory.role].run(creep);
        } else {
            console.log('Unknown creep type:', creep.memory.role);
        }
    }
    for (var name in Game.structures) {
        var struct = Game.structures[name];
        var obj = Game.getObjectById(struct.id);
        if (!obj.my) continue;
        if (structure[struct.structureType]) {
            structure[struct.structureType].run(obj);
        }
    }
    util.roads.maybeBuild();
};
