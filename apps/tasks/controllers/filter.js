// ==========================================================================
// Tasks.filterController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for Application Settings.
*/
Tasks.filterController = SC.ObjectController.create(
/** @scope Orion.filterController.prototype */ {
  
    openPane: function(){
      Tasks.assignmentsController.backupAttributeFilterCriteria();
      var pane = Tasks.get('filterPane');
      if(pane) pane.append();
    },
    
    closePane: function(){
      Tasks.assignmentsController.restoreAttributeFilterCriteria();
      this._close();
    },
    
    applyFilter: function(){
      this._close();
      Tasks.assignmentsController.showAssignments();
    },
    
    _close: function(){
      var pane = Tasks.get('filterPane');
      if(pane) {
        pane.remove();
        pane.destroy();
      }
    }
    
});