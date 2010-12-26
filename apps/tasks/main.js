/*globals Tasks CoreTasks */

/**
 * The main program - start off in first state.
 */
 /*globals sc_require */
sc_require('core_routes');

function main() { Tasks.main(); }

// The following are used to indicate which editor is popped up
Tasks.TASK_EDITOR = 1;
Tasks.FILTER_EDITOR = 2;
Tasks.editorPoppedUp = null;

Tasks.assignmentsRedrawNeeded = false;

Tasks.main = function main() {
  
  // console.log('DEBUG: "Tasks" started at: %@'.fmt(new Date()));
  CoreTasks.dataSaveErrorCallback = Tasks.dataSaveErrorCallback;
  Tasks.registerRoutes();
  
  Tasks.isLoaded = YES; // for Lebowski
  
  // Setup timer to refresh project countDowns
  SC.Timer.schedule({
    target: 'Tasks.projectsController', 
    action: 'refreshCountdowns', 
    interval: 60*60*1000, // every hour
    repeats: YES
  });
  

};