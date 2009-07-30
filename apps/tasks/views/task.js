// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Used as exampleView for task information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.TaskView = SC.ListItemView.extend(
/** @scope Tasks.ListItemView.prototype */ {
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(content){
      
      var priority = content.get('priority');
      switch(priority){
        case Tasks.TASK_PRIORITY_HIGH:
          context.addClass('tasks-priority-high');
          break;
        case Tasks.TASK_PRIORITY_MEDIUM:
          context.addClass('tasks-priority-medium');
          break;
        case Tasks.TASK_PRIORITY_LOW:
          context.addClass('tasks-priority-low');
          break;          
      }
      
      var status = content.get('status');
      switch(status){
        case Tasks.TASK_STATUS_PLANNED:
          context.addClass('tasks-status-planned');
          break;
        case Tasks.TASK_STATUS_ACTIVE:
          context.addClass('tasks-status-active');
          break;
        case Tasks.TASK_STATUS_DONE:
          context.addClass('tasks-status-done');
          break;          
        case Tasks.TASK_STATUS_RISKY:
          context.addClass('tasks-status-risky');
          break;          
      }
      
      var validation = content.get('validation');
      switch(validation){
        case Tasks.TASK_VALIDATION_UNTESTED:
          context.addClass('tasks-validation-untested');
          break;
        case Tasks.TASK_VALIDATION_PASSED:
          context.addClass('tasks-validation-passed');
          break;
        case Tasks.TASK_VALIDATION_FAILED:
          context.addClass('tasks-validation-failed');
          break;          
      }
      
    }

    sc_super();
  }
  
});
