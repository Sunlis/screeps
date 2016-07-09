/**
 * Resource promise.
 *
 * @constructor
 *
 * @param {!RoomObject} from
 * @param {!RoomObject} to
 * @param {string} resource
 * @param {number} amount
 */
Promise = function(from, to, resource, amount) {
  /** @type {number} */
  this.id = Promise.nextId;
  Promise.nextId++;
  Memory.promises.nextId = Promise.nextId;

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
Promise.nextId = Memory.promises.nextId || 0;

if (!Memory.promises.list) Memory.promises.list = [];
/**
 * @type {!Array<!Promise>}
 */
Promise.promises = [];

/**
 * Normalize a promise object or serialized string.
 *
 * @param {!Promise|string} obj
 * @return {?Promise}
 */
Promise.normalize = function(obj) {
  if (typeof(promise) == 'string') {
    return Promise.deserialize(obj);
  } else if (obj instanceof Promise) {
    return obj;
  }
};

/**
 * Remove a promise from cache and Memory.
 *
 * @param {!Promise|string} obj
 * @param {boolean} Whether the promise was found and removed.
 */
Promise.unsave = function(obj) {
  var promise = Promise.normalize(obj);

  var cacheIndex = _.findIndex(Promise.promises, function(cached) {
    return cached.id == promise.id;
  });
  if (cacheIndex != -1) {
    _.remove(Promise.promises, cacheIndex);
    return true;
  }
  var memoryIndex = _.findIndex(Memory.promises.list, function(memorized) {
    return Promise.deserialize(memorized).id == promise.id;
  });
  if (memoryIndex != -1) {
    _.remove(Memory.promises.list, memoryIndex);
  }
};

/**
 * Save a promise to cache and Memory.
 *
 * @param {!Promise|string} obj
 */
Promise.save = function(obj) {
  var promise = Promise.normalize(obj);
  // TODO: This may not be necessary, and for large numbers of promises could
  // be a performance issue.
  // But it's certainly easy.
  Promise.unsave(promise);

  Promise.promises.push(promise);
  Memory.promises.list.push(Promise.serialize(promise));
};

/**
 * Turn a Promise into a serialized promise suitable for storage.
 *
 * @param {!Promise} promise
 * @return {string}
 */
Promise.serialize = function(promise) {
  return [
    promise.id,
    promise.from,
    promise.to,
    promise.resource,
    promise.amount,
  ].join('|');
};

/**
 * Turn a serialized promise into a Promise object.
 *
 * @param {string} serialized
 * @return {!Promise}
 */
Promise.deserialize = function(serialized) {
  var split = serialized.split('|');
  var promise = new Promise(
      split[0], split[1], split[2], split[3], split[5]);
  return promise;
};

/**
 * Get a promise by id.
 *
 * @param {number} id
 * @return {?Promise}
 */
Promise.get = function(id) {
  var fromList = _.find(Promise.promises, function(promise) {
    return promise.id == id;
  });
  console.log('from list', JSON.stringify(fromList));
  if (fromList) {
    return fromList;
  } else {
    console.log('from memory', JSON.stringify(fromMemory));
    var fromMemory = _.find(Memory.promises.list, function(serialized) {
      var promise = Promise.deserialize(serialized);
      Promise.promises.push(promise);
      return promise.id == id;
    });
    if (fromMemory) {
      return fromMemory;
    }
  }
  return null;
};

/**
 * Promise to provide a given resource to another creep/structure/etc.
 *
 * @param {!RoomObject} from The object promising the resource.
 * @param {!RoomObject} to The object being promised a resource.
 * @param {string} resource A RESOURCE_* constant.
 * @param {number} amount How much of that resource is being promised.
 * @return {!Promise}
 */
Promise.swear = function(from, to, resource, amount) {
  var promise = new Promise(from, to, resource, amount);
  promise.save();
  return promise;
};

/**
 * Break all provided promises. Useful for cancelling the promises of a
 * dead creep.
 *
 * @param {!Array<!Promise|string>} objs
 * @return {!Array<boolean>} An array of successes for each promise.
 */
Promise.breakAll = function(objs) {
  return _.map(objs, function(obj) {
    var promise = Promise.normalize(obj);
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
Promise.prototype.remaining = function() {
  return this.amount;
};

/**
 * Partially complete a promise. If this is enough to complete the promise,
 * it will be marked as completed automatically.
 *
 * @param {number} amount
 * @return {boolean} Whether this completed the promise.
 */
Promise.prototype.partial = function(amount) {
  this.amount -= amount;
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
Promise.prototype.break = function() {
  // TODO: notify?
  return this.unsave();
};

/**
 * Finish a promise. This rarely needs to be called externally, as `partial`
 * serves a more useful purpose.
 *
 * @return {boolean}
 */
Promise.prototype.finish = function() {
  return this.unsave();
};

/**
 * Convenience method for serializing a promise.
 * @see Promise.serialize()
 *
 * @return {string} The serialized version of this promise.
 */
Promise.prototype.serialize = function() {
  return Promise.serialize(this);
};

/**
 * Convenience method for saving a promise.
 * @see Promise.save()
 *
 * @return {!Promise}
 */
Promise.prototype.save = function() {
  Promise.save(this);
  return this;
};

/**
 * Convenience method for unsaving a promise.
 * @see Promise.unsave()
 *
 * @return {!Promise}
 */
Promise.prototype.unsave = function() {
  Promise.unsave(this);
  return this;
};

module.exports = Promise;
