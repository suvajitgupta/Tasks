// ==========================================================================
// Tasks.settingsController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for Application Settings.
*/
Tasks.settingsController = SC.ObjectController.create(
/** @scope Tasks.settingsController.prototype */ {
  
  openPanel: function(){
    var pane = Tasks.get('settingsPane');
    if(pane) {
      // Scroll to/select logged in user and open User Manager
      var currentUser = CoreTasks.get('currentUser');
      Tasks.usersController.selectObject(currentUser);
      if(!CoreTasks.isCurrentUserAManager()) pane.setSmallSize();
      pane.append();
    }
  }
        
});