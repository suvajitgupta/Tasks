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
      var panel = Tasks.getPath('settingsPage.panel');
      if(panel) {
        // Scroll to/select logged in user and open User Manager
        var currentUser = CoreTasks.get('currentUser');
        var usersList = Tasks.settingsPage.get('usersList');
        var idx = usersList.get('content').indexOf(currentUser);
        usersList.scrollToContentIndex(idx); // FIXME: [SC] see why list won't scroll to selected item on demand
        Tasks.usersController.selectObject(currentUser);
        panel.append();
      }
    },
    
    closePanel: function(){
      var panel = Tasks.getPath('settingsPage.panel');
      if(panel) {
        panel.remove();
        panel.destroy();
      }
    }
    
});