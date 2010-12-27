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
    if(!Tasks.get('editorPoppedUp')) Tasks.set('editorPoppedUp', Tasks.FILTER_EDITOR);
    if(pane) pane.append();
  },
  
  closePane: function(){
    Tasks.assignmentsController.restoreAttributeFilterCriteria();
    this._close();
  },
  
  applyFilter: function(){
    this._close();
    if(Tasks.assignmentsRedrawNeeded) Tasks.assignmentsController.computeTasks();
  },
  
  _close: function(){
    if(Tasks.get('editorPoppedUp') === Tasks.FILTER_EDITOR) Tasks.set('editorPoppedUp', null);
    var pane = Tasks.get('filterPane');
    if(pane) {
      pane.remove();
    }
  }
  
});