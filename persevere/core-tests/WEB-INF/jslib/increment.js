// from: https://wiki.mozilla.org/ServerJS/Modules/SecurableModules
// increment.js
//
var add = require('math').add;
exports.increment = function(val) {
  return add(val, 1);
};
