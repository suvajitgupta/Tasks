// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  A textual summary of what is displayed in the Tasks application.
  
  @extends SC.View
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
      
    }

    sc_super();
  }
  
});
