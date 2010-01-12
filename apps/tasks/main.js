/*globals Tasks CoreTasks */

/**
 * The main program - start off in first state.
 */
 /*globals sc_require */
sc_require('core_routes');

function main() { Tasks.main(); }

Tasks.main = function main() {

  // console.log('DEBUG: "Tasks" started at: %@'.fmt(new Date()));
  Tasks.registerRoutes();

};