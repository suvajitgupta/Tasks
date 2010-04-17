// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Display number of Tasks in selected Project.
  
  @extends SC.LabelView
  @author Suvajit Gupta
*/

Tasks.SummaryView = SC.LabelView.extend(
/** @scope Tasks.SummaryView.prototype */ {
  
  displayMode: null,
  tasksTree: null,
  projectsSelection: null,
  tasksSelection: null,
  displayProperties: ['displayMode', 'tasksTree', 'projectsSelection', 'tasksSelection'],
  
  render: function(context, firstTime) {

    var message = '';
    if(this.tasksTree) {
      var assigneesCount = 0;
      var assignmentNodes = this.tasksTree.get('treeItemChildren');
      if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
      message += (assigneesCount + "_assignees".loc());

      var tasksCount = 0;
      var redFlags = 0;
      for(var i=0; i < assigneesCount; i++) {
        var assignmentNode = assignmentNodes.objectAt(i);
        tasksCount += assignmentNode.get('tasksCount');
        var riskyTasksCount = assignmentNode.get('riskyTasksCount');
        var failedTasksCount = assignmentNode.get('failedTasksCount');
        if(riskyTasksCount > 0 || failedTasksCount > 0) redFlags++;
      }
      if(this.displayMode === Tasks.DISPLAY_MODE_TASKS) {
        message += tasksCount + "_tasks".loc();
      }
      else { // this.displayMode === Tasks.DISPLAY_MODE_TEAM
        message += redFlags + "_redFlags".loc();
      }
      message += "_displayed".loc() + ', ';
    }
    
    var projectsSelection = this.get('projectsSelection');
    if(projectsSelection) {
      message += (projectsSelection.get('length') + "_projects".loc());
    }
    var tasksSelection = this.get('tasksSelection');
    if(tasksSelection) {
      message += (tasksSelection.get('length') + "_tasks".loc());
    }
    if(projectsSelection || tasksSelection) {
      message += "_selected".loc();
    }
    
    // display value
    this.set('value', message);
    sc_super();
    
  }
  
});