//============================================================================
// Tasks.allTasksController
//============================================================================
/*globals Tasks SCUI */

/**

  This is the AllTasks Controller to track all tasks loaded into Tasks
  
  @extends SC.ArrayController
  @author Suvajit Gupta
  @version preBeta
  @since preBeta

*/

Tasks.allTasksController = SC.ArrayController.create(SCUI.StatusChanged,
  /** @scope Tasks.allTasksController.prototype */ {
    
  contentStatusDidChange: function(status){
    // console.log('DEBUG: allTasksController ' + status);
    if (status & SC.Record.READY){
      Tasks.tasksLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }
  
});