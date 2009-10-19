//============================================================================
// Tasks.allTasksController
//============================================================================
/*globals Tasks sc_require */
sc_require('mixins/status_changed');

/**

  This is the AllTasks Controller to track all tasks loaded into Tasks
  
  @extends SC.ArrayController
  @author Suvajit Gupta
  @version preBeta
  @since preBeta

*/

Tasks.allTasksController = SC.ArrayController.create(Tasks.StatusChanged,
  /** @scope Tasks.allTasksController.prototype */ {
    
  contentStatusDidChange: function(status){
    console.log("DEBUG: allTasksController " + status);
    if (status & SC.Record.READY){
      Tasks.tasksLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }
  
});