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
  
  classNames: 'bottom-bar-label transparent'.w(),
  
  escapeHTML: NO,
  panelOpen: null,
  assignmentsSummary: null,
  projectsSelection: null,
  tasksSelection: null,
  displayProperties: ['panelOpen', 'assignmentsSummary', 'projectsSelection', 'tasksSelection'],
  
  render: function(context, firstTime) {

    // console.log('DEBUG: SummaryView.render()');
    
    var message = '';
    
    if(this.get('panelOpen') !== Tasks.TASK_EDITOR) {
      var assignmentsSummary = this.get('assignmentsSummary');
      if(assignmentsSummary) message += (assignmentsSummary + "_displayed".loc());
    }
    
    var projectsSelection = this.get('projectsSelection');
    if(projectsSelection) {
      if(message !== '') message += ', ';
      message += (projectsSelection.get('length') + "_projects".loc());
    }
    var tasksSelection = this.get('tasksSelection');
    if(tasksSelection) message += (tasksSelection.get('length') + "_tasks".loc());
    if(projectsSelection || tasksSelection) message += "_selected".loc();
    
    this.set('value', message);
    sc_super();
    
  }
  
});