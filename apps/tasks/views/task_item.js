// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as exampleView for task information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.TaskItemView = SC.ListItemView.extend(
/** @scope Tasks.TaskItemView.prototype */ {
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(content && content.get('name')){ // a task node, not an assignee node
      
      var priority = content.get('priority');
      switch(priority){
        case CoreTasks.TASK_PRIORITY_HIGH:
          context.addClass('tasks-priority-high');
          break;
        case CoreTasks.TASK_PRIORITY_MEDIUM:
          context.addClass('tasks-priority-medium');
          break;
        case CoreTasks.TASK_PRIORITY_LOW:
          context.addClass('tasks-priority-low');
          break;          
      }
      
      var status = content.get('status');
      switch(status){
        case CoreTasks.TASK_STATUS_PLANNED:
          context.addClass('tasks-status-planned');
          break;
        case CoreTasks.TASK_STATUS_ACTIVE:
          context.addClass('tasks-status-active');
          break;
        case CoreTasks.TASK_STATUS_DONE:
          context.addClass('tasks-status-done');
          break;          
        case CoreTasks.TASK_STATUS_RISKY:
          context.addClass('tasks-status-risky');
          break;          
      }
      
      var validation = content.get('validation');
      switch(validation){
        case CoreTasks.TASK_VALIDATION_UNTESTED:
          context.addClass('tasks-validation-untested');
          break;
        case CoreTasks.TASK_VALIDATION_PASSED:
          context.addClass('tasks-validation-passed');
          break;
        case CoreTasks.TASK_VALIDATION_FAILED:
          context.addClass('tasks-validation-failed');
          break;          
      }
      
    }

    sc_super();
  }
  
});
