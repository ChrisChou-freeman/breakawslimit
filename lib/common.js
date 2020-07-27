'use strict';
exports.isEmptyObj = function (obj) {
  if (obj == null) return true;
  if (typeof obj != 'object') return true;
  if ((Object.keys(obj).length == 0)) return true;
  return false;
};

exports.isEmptyArray = (obj) => {
  if (obj == null) return true;
  if (!Array.isArray(obj)) return true;
  if (obj.length == 0) return true;
  return false;
}

exports.isEmptyString = function (obj) {
  if (typeof obj != 'string') return true;
  if (obj == "null") return true;
  if (obj == "undefined") return true;
  if (obj.length == 0) return true;
  return false;
};

exports.isEmptyNumber = function (obj) {
  if (typeof obj != 'number') return true;
  if (obj == "null") return true;
  if (obj.length == 0) return true;
  return false;
};

