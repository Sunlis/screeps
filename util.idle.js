var find = require('util.find');

/** @param {!Creep} */
var idle = function(creep) {
    var flag = find.flag(creep.room, function(flag) {
        return flag.name == 'gather';
    });
    if (!flag) {
        return false;
    }
    creep.say('idling');
    return creep.moveTo(flag);
};

module.exports = idle;