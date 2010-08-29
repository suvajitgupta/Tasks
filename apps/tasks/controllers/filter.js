// ==========================================================================
// Tasks.filterController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for Filter.
*/
Tasks.filterController = SC.ObjectController.create(
/** @scope Tasks.filterController.prototype */ {
  
  openPane: function(){
    Tasks.assignmentsController.backupAttributeFilterCriteria();
    var pane = Tasks.get('filterPane');
    Tasks.editorPoppedUp = Tasks.FILTER_EDITOR;
    if(pane) pane.append();
  },
  
  closePane: function(){
    Tasks.assignmentsController.restoreAttributeFilterCriteria();
    this._close();
  },
  
  applyFilter: function(){
    this._close();
    Tasks.editorPoppedUp = null;
    if(Tasks.assignmentsRedrawNeeded) Tasks.assignmentsController.showAssignments();
  },
  
  _close: function(){
    var pane = Tasks.get('filterPane');
    if(pane) {
      pane.remove();
    }
  }
  
});