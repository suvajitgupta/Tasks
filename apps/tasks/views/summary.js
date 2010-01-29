// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Display number of Tasks in selected Project.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.SummaryView = SC.View.extend(
/** @scope Tasks.SummaryView.prototype */ {
  
  projectsCount: '',
  tasksTree: '',

  displayProperties: ['projectsCount', 'tasksTree'],
  
  render: function(context, firstTime) {

    var projectsCount = this.get('projectsCount');
    var summary = "_Displaying".loc() + (projectsCount < 2? 0 : projectsCount-2) + "_projects".loc();

    if(this.tasksTree) {
      var assigneesCount = 0;
      var assignmentNodes = this.tasksTree.get('treeItemChildren');
      if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
      summary += assigneesCount + "_assignees".loc();

      var tasksCount = 0;
      var redFlags = 0;
      for(var i=0; i < assigneesCount; i++) {
        var assignmentNode = assignmentNodes.objectAt(i);
        tasksCount += assignmentNode.get('tasksCount');
        var riskyTasksCount = assignmentNode.get('riskyTasksCount');
        var failedTasksCount = assignmentNode.get('failedTasksCount');
        if(riskyTasksCount > 0 || failedTasksCount > 0) redFlags++;
      }
      if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TEAM) {
        summary += redFlags + "_RedFlags".loc();
      }
      else { // display mode === Tasks.DISPLAY_MODE_TASKS
        summary += tasksCount + "_tasks".loc();
      }
    }
    
    // display value
    context.push(summary);
    
  }
  
});