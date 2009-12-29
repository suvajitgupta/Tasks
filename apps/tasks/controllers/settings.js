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
        // Select/scroll to logged in user and open User Manager
        var currentUser = CoreTasks.get('currentUser');
        Tasks.usersController.selectObject(currentUser);
        var usersList = Tasks.settingsPage.get('usersList');
        var idx = usersList.get('content').indexOf(currentUser);
        usersList.scrollToContentIndex(idx); // FIXME: [SC] see why list won't scroll to selected item on demand
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