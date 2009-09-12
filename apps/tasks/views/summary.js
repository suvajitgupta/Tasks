// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Display number of Tasks in selected Project.
  
  @extends SC.View
  @author Suvajit Gupta
*/

// TODO: [SG] show number of tasks actually rendered after assignee/task search filtering (if any)
Tasks.SummaryView = SC.View.extend(
/** @scope Tasks.SummaryView.prototype */ {
  
  projectsCount: '',
  tasksCount: '',

  displayProperties: ['projectsCount', 'tasksCount'],
  
  render: function(context, firstTime) {

    var summary = "%@ projects, ".fmt(this.get('projectsCount')-2);

    var taskCount = this.get('tasksCount');
    switch(taskCount) {
      case 0: 
        summary += "_NoTasksProject".loc();
        break;
      case 1:
        summary += "_OneTaskProject".loc();
        break;
      default:
        summary += (taskCount + "_ManyTasksProject".loc());
        break;
    }
    
    // display value
    context.push(summary);
    
  }
  
});
