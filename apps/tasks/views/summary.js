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

    var summary = "_Displaying".loc() + (this.get('projectsCount')-2) + "_Projects".loc();

    if(!this.tasksTree) return;
    
    var assigneesCount = 0;
    var assignmentNodes = this.tasksTree.get('treeItemChildren');
    if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
    summary += assigneesCount + "_Assignees".loc();
    
    var tasksCount = 0;
    for(var i=0; i < assigneesCount; i++) {
      tasksCount += assignmentNodes.objectAt(i).get('treeItemChildren').get('length');
    }
    summary += tasksCount + "_Tasks".loc();
        
    // display value
    context.push(summary);
    
  }
  
});