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
  
  openPanel: function(){
    Tasks.assignmentsController.backupAttributeFilterCriteria();
    var pane = Tasks.get('filterPane');
    if(!Tasks.get('editorPoppedUp')) Tasks.set('editorPoppedUp', Tasks.FILTER_EDITOR);
    if(pane) pane.append();
  },
  
  closePanel: function(){
    if(Tasks.get('editorPoppedUp') === Tasks.FILTER_EDITOR) Tasks.set('editorPoppedUp', null);
    var pane = Tasks.get('filterPane');
    if(pane) {
      pane.remove();
    }
  }
  
});