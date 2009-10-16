//============================================================================
// Tasks.allTasksController
//============================================================================
/*globals Tasks */

/**

  This is the AllTasks Controller to track all tasks loaded into Tasks
  
  @extends SC.ArrayController
  @author Suvajit Gupta
  @version preBeta
  @since preBeta

*/

Tasks.allTasksController = SC.ArrayController.create(Tasks.statusChanged,
  /** @scope Tasks.allTasksController.prototype */ {
    
  contentStatusDidChange: function(status){
    if (status & SC.Record.READY){
      Tasks.tasksLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }
  
});