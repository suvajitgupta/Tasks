// ==========================================================================
// Tasks.watchesController
// ==========================================================================
/*globals CoreTasks Tasks SCUI */
/** 
  This is the controller for all Projects

  @extends SC.ArrayController
  @author Suvajit Gupta
*/

Tasks.watchesController = SC.ArrayController.create(SCUI.StatusChanged,
/** @scope Tasks.watchesController.prototype */ {
  
  _contentDidChange: function() {
    Tasks.tasksController.propertyDidChange('watches');
  }.observes('[]'),
  
  contentStatusDidChange: function(status){
    // console.log('DEBUG: watchesController ' + status);
    if (status & SC.Record.READY){
      Tasks.watchesLoadSuccess();
    }
    else if (status & SC.Record.ERROR){
      Tasks.dataLoadFailure();
    }
  }

});
