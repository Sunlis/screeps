
/**
 * Provides a way for objects to promise resources to other objects.
 * @type {Object}
 */
var promise = {
  /**
   * @const @type {!Array<!ResourcePromise>}
   */
  promises: [],

  /**
   * Get a promise by id.
   *
   * @param {number} id
   * @return {?ResourcePromise}
   */
  get: function(id) {
    var fromList = _.find(promise.promises, function(promise) {
      return promise.id == id;
    });
    console.log('from list', JSON.stringify(fromList));
    if (fromList) {
      return fromList;
    } else {
      console.log('from memory', JSON.stringify(fromMemory));
      var fromMemory = _.find(Memory.promises.list, function(serialized) {
        var promise = ResourcePromise.deserialize(serialized);
        promise.promises.push(promise);
        return promise.id == id;
      });
      if (fromMemory) {
        return fromMemory;
      }
    }
    return null;
  },

  /**
   * Promise to provide a given resource to another creep/structure/etc.
   *
   * @param {!RoomObject} from The object promising the resource.
   * @param {!RoomObject} to The object being promised a resource.
   * @param {string} resource A RESOURCE_* constant.
   * @param {number} amount How much of that resource is being promised.
   * @return {number} The ID of the created promise. Keep this.
   */
  swear: function(from, to, resource, amount) {
    var promise = new ResourcePromise(from, to, resource, amount);
    promise.promises.push(promise);
    Memory.promises.list.push(promise.serialize());
    return promise.id;
  },

  /**
   * Check the remaining amount on a promise.
   *
   * @param {number} id
   * @return {number} The amount remaining in the promise.
   */
  remaining: function(id) {

  },

  /**
   * Partially complete a promise. If this is enough to complete the promise,
   * it will be marked as completed automatically.
   *
   * @param {number} id
   * @param {number} amount
   * @return {boolean} Whether this completed the promise.
   */
  partial: function(id, amount) {

  },

  /**
   * Break a promise. The target should seek the resource elsewhere.
   *
   * @param {number} id
   * @return {boolean} Whether the promise was removed successfully.
   */
  break: function(id) {

  },

  /**
   * Finish a promise. This rarely needs to be called externally, as `partial`
   * serves a more useful purpose.
   *
   * @param {number} id
   * @return {boolean} Whether the promise was removed successfully.
   */
  finish: function(id) {

  },

  /**
   * Break all promises. Useful for cancelling the promises of a dead creep.
   *
   * @param {!Array<number>} ids
   * @return {!Array<boolean>} An array of successes for each promise.
   */
  breakAll: function(ids) {

  },
};

module.exports = promise;

ResourcePromise = function(from, to, resource, amount) {
  /** @type {number} */
  this.id = ResourcePromise.nextId;
  ResourcePromise.nextId++;
  Memory.promises.nextId = ResourcePromise.nextId;

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
ResourcePromise.nextId = Memory.promises.nextId || 0;

/**
 * Turn a ResourcePromise into a serialized promise suitable for storage.
 *
 * @param {!ResourcePromise} promise
 * @return {string}
 */
ResourcePromise.serialize = function(promise) {
  return [
    promise.id,
    promise.from,
    promise.to,
    promise.resource,
    promise.amount,
  ].join('|');
};

/**
 * Turn a serialized promise into a ResourcePromise object.
 *
 * @param {string} serialized
 * @return {!ResourcePromise}
 */
ResourcePromise.deserialize = function(serialized) {
  var split = serialized.split('|');
  var promise = new ResourcePromise(
      split[0], split[1], split[2], split[3], split[5]);
  return promise;
};

/**
 * Convenience method for serializing a promise.
 * @see ResourcePromise.serialize()
 *
 * @return {string} The serialized version of this promise.
 */
ResourcePromise.prototype.serialize = function() {
  return ResourcePromise.serailize(this);
};
