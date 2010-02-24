/*globals Tasks CoreTasks */

/**
 * The main program - start off in first state.
 */
 /*globals sc_require */
sc_require('core_routes');

function main() { Tasks.main(); }

// if software mode set to false, works as a simple ToDo list (Task Type/Validation are not available through GUI)
Tasks.softwareMode = document.title.match(/todo/i)? false: true;

Tasks.editorPoppedUp = false;
Tasks.assignmentsRedrawNeeded = false;
Tasks.sourcesRedrawNeeded = false;

Tasks.main = function main() {

  // console.log('DEBUG: "Tasks" started at: %@'.fmt(new Date()));
  Tasks.registerRoutes();

};