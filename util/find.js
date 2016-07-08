var find = {
    find_: function(list, condition) {
        for (var i in list) {
            if (!condition) {
                return list[i];
            } else if (condition(list[i])) {
                return list[i];
            }
        }
        return false;
    },
    find: function(group, type, def, condition) {
        var list;
        if (group instanceof Room) {
            list = room.find(type);
        } else {
            list = def;
        }
        return find.find_(list, condition);
    },
    spawn: function(room, condition) {
        var list;
        if (room instanceof Room) {
            list = room.find(FIND_MY_SPAWNS);
        } else {
            list = Game.spawns;
        }
        return find.find_(list, condition);
    },
    flag: function(room, condition) {
        return find.find_(room.find(FIND_FLAGS), condition);
    }
};

module.exports = find;