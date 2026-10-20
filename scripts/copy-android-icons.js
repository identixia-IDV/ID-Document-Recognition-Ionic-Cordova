#!/usr/bin/env node
/** Compatibility shim — config.xml historically pointed here. */
module.exports = require('../tools/copy-android-icons.js');
if (require.main === module) {
  module.exports(null);
}
