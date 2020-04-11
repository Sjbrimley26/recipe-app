function Node (val) {
  this.value = val;
  this.next = null;
}

function Queue () {
  this.head = null;
  this.tail = null;
  this._onPushEvents = [];
  this._onPopEvents = [];
  this.length = 0;
}

/**
 * Add an item to the Queue, at the end
 * @name Queue#push
 * @param {*} val can be anything, really
 */
Queue.prototype.push = function (val) {
  const node = new Node(val);
  this.length += 1;
  if (this.head === null) {
    this.head = node;
    this.tail = node;
  } else if (this.head === this.tail) {
    this.head.next = node;
    this.tail = node;
  } else {
    this.tail.next = node;
    this.tail = node;
  }
  this._onPushEvents.forEach(fn => fn(this));
}

/**
 * Returns the value at the front of the Queue, without removing it.
 * @name Queue#peek
 * @returns {*} val returns whatever you put in
 */
Queue.prototype.peek = function () {
  return this.head.value;
}

/**
 * Returns the value at the front of the Queue, removing it and moving the next node to the front.
 * @name Queue#pop
 * @returns {*} val returns whatever you put in
 */
Queue.prototype.pop = function () {
  const ret = this.head.value;
  this.head = this.head.next;
  this.length -= 1;
  this._onPopEvents.forEach(fn => fn(this));
  return ret;
}

/**
 * Returns true if the Queue is empty.
 * @name Queue#isEmpty
 * @returns {boolean}
 */
Queue.prototype.isEmpty = function () {
  return this.head === null;
}

/**
 * Adds a function to the Queue to be called whenever an item is added to it.
 * The function is called with the Queue itself as the parameter.
 * @name Queue#onPush
 * @param {Object} fn the callback function.
 */
Queue.prototype.onPush = function (fn) {
  this._onPushEvents.push(fn);
}

Queue.prototype.onPop = function (fn) {
  this._onPopEvents.push(fn);
}

module.exports = Queue;
