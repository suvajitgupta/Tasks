// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Display number of Tasks in selected Project.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.SummaryView = SC.View.extend( // TODO: [SG] I18N all strings
/** @scope Tasks.SummaryView.prototype */ {
  
  projectsCount: '',
  tasksCount: '',

  displayProperties: ['projectsCount', 'tasksCount'],
  
  render: function(context, firstTime) {

    var summary = "%@ projects, ".fmt(this.get('projectsCount')-2);

    var taskCount = this.get('tasksCount');
    switch(taskCount) {
      case 0: 
        summary += "selected project has no tasks.";
        break;
      case 1:
        summary += "selected project has 1 task.";
        break;
      default:
        summary += "selected project has %@ tasks.".fmt(taskCount);
        break;
    }
    
    // display value
    context.push(summary);
    
  }
  
});
