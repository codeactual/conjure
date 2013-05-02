/**
 * Reference to Status.
 */
module.exports = Status;

/**
 * Status constructor.
 *
 * @param {string} type
 * - `wait` Test script is waiting for a condition to become true, ex. selector match.
 * @param {object} detail Additional metadata, ex. current test helper method name/args
 */
function Status(type, detail) {
  this.type = type;
  this.detail = detail;
}

/**
 * Stringify instance, ex. for debugging.
 *
 * @api private
 */
Status.prototype.toString = function() {
  return JSON.stringify(this);
};
