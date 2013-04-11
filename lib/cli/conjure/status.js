module.exports = Status;

function Status(type, detail) {
  this.type = type;
  this.detail = detail;
}

Status.prototype.toString = function() {
  return JSON.stringify(this);
};
