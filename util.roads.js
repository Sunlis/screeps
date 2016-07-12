var roads = {

    CACHE_LIMIT: 20,
    CHECK_INTERVAL: 200,
    CLEAR_INTERVAL: 1000,
    MIN_COUNT: 3,

    monitor: function() {
        if (!Memory.roads || Game.time % roads.CLEAR_INTERVAL == 0) roads.clear();
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.spawning) continue;
            if (!creep.memory.last) {
                creep.memory.last = creep.pos;
                continue;
            }
            // Don't care about them if they're standing still
            if (creep.memory.last.x == creep.pos.x && creep.memory.last.y == creep.pos.y) {
                continue;
            }
            var lookList = creep.room.lookForAt(LOOK_STRUCTURES, creep.pos);
            var foundRoad = false;
            for (var i in lookList) {
                var look = lookList[i];
                if (look.structureType == 'road' || look.structureType == 'constructionSite') {
                    foundRoad = true;
                    break;
                }
            }
            if (!foundRoad) {
                roads.cache_(creep);
            } else {
                roads.remove_(creep);
            }
            creep.memory.last = creep.pos;
        }
    },
    maybeBuild: function() {
        if (Game.time % roads.CHECK_INTERVAL != 0) {
            return;
        }
        var matches = _.filter(Memory.roads, (item) => item.count >= roads.MIN_COUNT);
        matches = _.sortByOrder(matches, ['count'], ['desc']);
        if (matches.length) {
            // console.log('Road candidates');
            // console.log(JSON.stringify(matches));
            var match = matches[0];
            var pos = roads.parseKey_(match.key);
            roads.clear();
            var room = Game.rooms[match.room];
            if (room) {
                console.log('Creating new road at ' + pos.x + ',' + pos.y + ' in room ' + room.name);
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            }
        } else {
            // console.log('No suitable road locations found');
            // console.log(JSON.stringify(Memory.roads));
        }
    },
    clear: function() {
        Memory.roads = [];
    },
    cache_: function(creep) {
        var pos = creep.pos;
        var key = roads.getKey_(pos);
        var index = _.findIndex(Memory.roads, {key: key});
        var obj = null;
        if (index == -1) {
            obj = {key: key, room: creep.room.name, count: 1};
            Memory.roads.push(obj);
        } else {
            obj = Memory.roads[index];
            Memory.roads.splice(index, 1);
            obj.count++;
            Memory.roads.push(obj);
        }
        while (Memory.roads.length > roads.CACHE_LIMIT) {
            Memory.roads.shift();
        }
    },
    remove_: function(creep) {
        var pos = creep.pos;
        var key = roads.getKey_(pos);
        var index = _.findIndex(Memory.roads, {key: key});
        if (index != -1) {
            Memory.roads.splice(index, 1);
        }
    },
    getKey_: function(pos) {
        return pos.x + "_" + pos.y;
    },
    parseKey_: function(key) {
        var split = key.split('_');
        return {x: parseInt(split[0], 10), y: parseInt(split[1], 10)};
    },
};

module.exports = roads;
