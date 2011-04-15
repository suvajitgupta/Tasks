/*globals Tasks CoreTasks sc_require */

function main() { Tasks.main(); }

// The following are used to indicate which editor is popped up
Tasks.LOGIN_PANEL = 0;
Tasks.TASK_EDITOR = 1;
Tasks.FILTER_EDITOR = 2;
Tasks.panelOpen = null;

Tasks.main = function main() {
  
  // console.log('DEBUG: "Tasks" started at: %@'.fmt(new Date()));
  if(SC.BaseTheme.renderers) SC.BaseTheme.renderers.MasterDetail.BORDER = 0;
  CoreTasks.dataSaveErrorCallback = Tasks.dataSaveErrorCallback;
  Tasks.registerRoutes();
  SC.RootResponder.responder.set('defaultResponder', Tasks.statechart);
  Tasks.statechart.initStatechart();
  
  // Setup timer to refresh project countDowns
  SC.Timer.schedule({
    target: 'Tasks.projectsController', 
    action: 'refreshCountdowns', 
    interval: 60*60*1000, // every hour
    repeats: YES
  });
  
  // Let Lebowski know application is ready
  Tasks.isLoaded = YES;

};