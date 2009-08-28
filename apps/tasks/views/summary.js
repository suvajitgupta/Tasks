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
  selectedProjectTaskCount: '',

  displayProperties: ['projectsCount', 'selectedProjectTaskCount'],
  
  render: function(context, firstTime) {

    var summary = "There are %@ projects.  ".fmt(this.get('projectsCount')-2);

    var taskCount = this.get('selectedProjectTaskCount');
    switch(taskCount) {
      case 0: 
        summary += "Selected project has no tasks.";
        break;
      case 1:
        summary += "Selected project has 1 task.";
        break;
      default:
        summary += "Selected project has %@ tasks.".fmt(taskCount);
        break;
    }
    
    // display value
    context.push(summary);
    
  }
  
});
