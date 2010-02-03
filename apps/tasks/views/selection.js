// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  Display number of Tasks in selected Project.
  
  @extends SC.LabelView
  @author Suvajit Gupta
*/

Tasks.SelectionView = SC.LabelView.extend(
/** @scope Tasks.SelectionView.prototype */ {
  
  projectsSelection: null,
  tasksSelection: null,
  displayProperties: ['projectsSelection', 'tasksSelection'],
  
  render: function(context, firstTime) {

    var message = "_Selected".loc();
    var projectsSelection = this.get('projectsSelection');
    if(projectsSelection) {
      message += (projectsSelection.get('length') + "_projects".loc());
    }
    var tasksSelection = this.get('tasksSelection');
    if(tasksSelection) {
      message += (tasksSelection.get('length') + "_tasks".loc());
    }
    
    // display value
    this.set('value', message);
    sc_super();
    
  }
  
});