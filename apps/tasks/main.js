/*globals Tasks CoreTasks */

/**
 * The main program - start off in first state.
 */
 /*globals sc_require */
sc_require('core_routes');

function main() { Tasks.main(); }

Tasks.softwareMode = true; // if set to false, works as a simple ToDo Manager (Task Type/Validation are not available through GUI)

Tasks.editorPoppedUp = false;
Tasks.assignmentsRedrawNeeded = false;
Tasks.sourcesRedrawNeeded = false;

Tasks.main = function main() {

  // console.log('DEBUG: "Tasks" started at: %@'.fmt(new Date()));
  Tasks.registerRoutes();

};