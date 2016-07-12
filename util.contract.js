/**
 * Resource promise.
 *
 * @constructor
 *
 * @param {!RoomObject} from
 * @param {!RoomObject} to
 * @param {string} resource
 * @param {number} amount
 * @param {number=} opt_id
 */
var Contract = function(from, to, resource, amount, opt_id) {
  /** @type {number} */
  this.id = null;
  if (opt_id) {
    this.id = opt_id;
  } else {
    this.id = Contract.nextId;
    Contract.nextId++;
    Memory.promises.nextId = Contract.nextId;
  }

  /** @type {string} */
  this.from = from.id;
  /** @type {string} */
  this.to = to.id;
  /** @type {string} RESOURCE_* */
  this.resource = resource;
  /** @type {number} */
  this.amount = amount;
};

if (!Memory.promises) Memory.promises = {};
/** @type {number} */
Contract.nextId = Memory.promises.nextId || 0;

if (!Memory.promises.list) Memory.promises.list = [];
/**
 * @type {!Array<!Contract>}
 */
Contract.promises = [];

/**
 * Normalize a promise object or serialized string.
 *
 * @param {!Contract|string} obj
 * @return {?Contract}
 */
Contract.normalize = function(obj) {
  if (typeof(obj) == 'string') {
    return Contract.deserialize(obj);
  } else if (obj instanceof Contract) {
    return obj;
  } else {
    return null;
  }
};

/**
 * Remove a promise from cache and Memory.
 *
 * @param {!Contract|string} obj
 * @param {boolean} Whether the promise was found and removed.
 */
Contract.unsave = function(obj) {
  var promise = Contract.normalize(obj);
  if (!promise) return;
  var serialized = Contract.serialize(promise);

  var from = Game.getObjectById(promise.from);
  if (from && from.memory && from.memory.promises) {
    _.remove(from.memory.promises, serialized);
  }

  var to = Game.getObjectById(promise.to);
  if (to && to.memory && to.memory.promises) {
    _.remove(to.memory.promises, serialized);
  }

  var cacheIndex = _.findIndex(Contract.promises, function(cached) {
    return cached.id == promise.id;
  });
  if (cacheIndex != -1) {
    _.remove(Contract.promises, cacheIndex);
    return true;
  }
  var memoryIndex = _.findIndex(Memory.promises.list, function(memorized) {
    var deserialized = Contract.deserialize(memorized);
    return deserialized && deserialized.id == promise.id;
  });
  if (memoryIndex != -1) {
    _.remove(Memory.promises.list, memoryIndex);
  }
};

/**
 * Save a promise to cache and Memory.
 *
 * @param {!Contract|string} obj
 */
Contract.save = function(obj) {
  var promise = Contract.normalize(obj);
  if (!promise) return;
  // TODO: This may not be necessary, and for large numbers of promises could
  // be a performance issue.
  // But it's certainly easy.
  Contract.unsave(promise);

  var serialized = Contract.serialize(promise);
  var from = Game.getObjectById(promise.from);
  if (from && from.memory && from.memory.promises) {
    if (_.indexOf(from.memory.promises, serialized) == -1) {
      from.memory.promises.push(serialized);
    }
  }

  var to = Game.getObjectById(promise.to);
  if (to && to.memory && to.memory.promises) {
    if (_.indexOf(to.memory.promises, serialized) == -1) {
      to.memory.promises.push(serialized);
    }
  }

  Contract.promises.push(promise);
  Memory.promises.list.push(Contract.serialize(promise));
};

/**
 * Turn a Contract into a serialized promise suitable for storage.
 *
 * @param {!Contract} promise
 * @return {string}
 */
Contract.serialize = function(promise) {
  if (promise && promise.id && promise.from && promise.to &&
      promise.resource && promise.amount) {
    return [
      promise.id,
      promise.from,
      promise.to,
      promise.resource,
      promise.amount,
    ].join('|');
  }
  return null;
};

/**
 * Turn a serialized promise into a Contract object.
 *
 * @param {string} serialized
 * @return {!Contract}
 */
Contract.deserialize = function(serialized) {
  if (!serialized) return null;
  var split = serialized.split('|');
  if (split.length == 5 && _.all(split, function(part) { return !!part; })) {
    var promise = new Contract(
      split[1], split[2], split[3], split[4], split[0]);
    return promise;
  }
  return null;
};

/**
 * Get a promise by id.
 *
 * @param {number} id
 * @return {?Contract}
 */
Contract.get = function(id) {
  return Contract.get_(function(promise) {
    return promise.id == id;
  });
};

/**
 * Get all promises sworn by the provided object.
 *
 * @param  {!RoomObject} from
 * @return {!Array<!Contract>}
 */
Contract.getFrom = function(from) {
  return Contract.getAll_(function(promise) {
    return promise.from == from.id;
  });
};

/**
 * Get all promises sworn to the provided object.
 *
 * @param {!RoomObject} to
 * @return {!Array<!Contract>}
 */
Contract.getTo = function(to) {
  return Contract.getAll_(function(promise) {
    return promise.to == to;
  });
};

/**
 * Get the total amount promised to others by this object.
 *
 * @param {!RoomObject} from
 * @param {?string} A RESOURCE_* constant
 * @return {number}
 */
Contract.getPromised = function(from, resource) {
  var allFrom = Contract.getFrom(from);
  var result;
  if (resource) {
    result = _.filter(allFrom, function(promise) {
      return promise.resource == resource;
    });
  } else {
    result = allFrom;
  }
  return _.reduce(allFrom,
    function(result, promise) {
      return result + promise.amount;
    }, 0);
};

/**
 * Get a single promise that matches a filter.
 * Optimized for finding a single Contract, compared to getAll_ which searches
 * all promises for matching items.
 *
 * @param {Function|Object|string} filter A lodash-compatible filter
 * @return {?Contract}
 * @private
 */
Contract.get_ = function(filter) {
  var fromCache = _.find(Contract.promises, filter);
  if (fromCache) {
    return fromCache;
  }
  Memory.promises.list = _.filter(Memory.promises.list, function(pr) {
    return !!pr;
  });
  var fromMemory = _.find(Memory.promises.list, function(obj) {
    var promise = Contract.normalize(obj);
    if (!promise) return false;
    // TODO: Not sure if I should really be doing this. What's the benefit?
    promise.save();
    return filter(promise);
  });
  if (fromMemory) {
    return fromMemory;
  }
  return null;
};

/**
 * Get all promises that match a filter.
 *
 * @param {Function|Object|string} filter A lodash-compatible filter
 * @return {!Array<!Contract>}
 * @private
 */
Contract.getAll_ = function(filter) {
  var result = [];
  var fromCache = _.filter(Contract.promises, filter);
  if (fromCache && fromCache.length) {
    result = result.concat(fromCache);
  }
  Memory.promises.list = _.filter(Memory.promises.list, function(pr) {
    return !!pr;
  });
  var fromMemory = _.filter(Memory.promises.list, function(obj) {
    var promise = Contract.normalize(obj);
    if (!promise) return false;
    // TODO: Not sure if I should really be doing this. What's the benefit?
    promise.save();
    return filter(promise);
  });
  if (fromMemory && fromMemory.length) {
    result = result.concat(fromMemory);
  }
  return result;
};

/**
 * Contract to provide a given resource to another creep/structure/etc.
 *
 * @param {!RoomObject} from The object promising the resource.
 * @param {!RoomObject} to The object being promised a resource.
 * @param {string} resource A RESOURCE_* constant.
 * @param {number} amount How much of that resource is being promised.
 * @return {!Contract}
 */
Contract.swear = function(from, to, resource, amount) {
  var promise = new Contract(from, to, resource, amount);
  promise.save();
  return promise;
};

/**
 * Break all provided promises. Useful for cancelling the promises of a
 * dead creep.
 *
 * @param {!Array<!Contract|string>} objs
 * @return {!Array<boolean>} An array of successes for each promise.
 */
Contract.breakAll = function(objs) {
  return _.map(objs, function(obj) {
    var promise = Contract.normalize(obj);
    if (promise) {
      return promise.break();
    }
    return false;
  })
};

/**
 * Check the remaining amount on a promise.
 *
 * @return {number} The amount remaining in the promise.
 */
Contract.prototype.remaining = function() {
  return this.amount;
};

/**
 * Partially complete a promise. If this is enough to complete the promise,
 * it will be marked as completed automatically.
 *
 * @param {number} amount
 * @return {boolean} Whether this completed the promise.
 */
Contract.prototype.partial = function(amount) {
  this.amount -= amount;
  this.save();
  if (this.amount <= 0) {
    this.finish();
    return true;
  } else {
    return false;
  }
};

/**
 * Break a promise. The target should seek the resource elsewhere.
 *
 * @return {boolean}
 */
Contract.prototype.break = function() {
  // TODO: notify?
  return this.unsave();
};

/**
 * Finish a promise. This rarely needs to be called externally, as `partial`
 * serves a more useful purpose.
 *
 * @return {boolean}
 */
Contract.prototype.finish = function() {
  return this.unsave();
};

/**
 * Convenience method for serializing a promise.
 * @see Contract.serialize()
 *
 * @return {string} The serialized version of this promise.
 */
Contract.prototype.serialize = function() {
  return Contract.serialize(this);
};

/**
 * Convenience method for saving a promise.
 * @see Contract.save()
 *
 * @return {!Contract}
 */
Contract.prototype.save = function() {
  Contract.save(this);
  return this;
};

/**
 * Convenience method for unsaving a promise.
 * @see Contract.unsave()
 *
 * @return {!Contract}
 */
Contract.prototype.unsave = function() {
  Contract.unsave(this);
  return this;
};

module.exports = Contract;
