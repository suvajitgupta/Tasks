// ==========================================================================
// Tasks.ImportDataController
// ==========================================================================

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Brandon Blatnick
  
  Controller for the import data pane.
*/
Tasks.importDataController = SC.ObjectController.create(
/** @scope Orion.ImportDataController.prototype */ {
    data: '',
    
    openPanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      if(panel) panel.append();
    },
    
    closePanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      panel.remove();
      panel.destroy();
      this.set('data','');
    },
    
    importData: function(){
      // TODO: Temporarily calling a private method until we refactor
      Tasks._parseAndLoadData(this.get('data'));
      Tasks.assignmentsController.showAssignments();
      this.closePanel();
    }
});
