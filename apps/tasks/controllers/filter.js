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
      var pane = Tasks.get('filterPane');
      if(pane) pane.append();
    },
    
    closePane: function(){
      var pane = Tasks.get('filterPane');
      pane.remove();
      pane.destroy();
      var filterButton = Tasks.getPath('mainPage.mainPane.filterButton');
      if(filterButton) filterButton.set('icon', Tasks.assignmentsController.attributeFilterIcon());
      Tasks.assignmentsController.showAssignments();
    }
    
});