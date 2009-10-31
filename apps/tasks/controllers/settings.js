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
/** @scope Orion.settingsController.prototype */ {
  
    openPanel: function(){
      var panel = Tasks.getPath('settingsPage.panel');
      if(panel) {
        // Select logged in user and open User Manager
        Tasks.usersController.selectObject(CoreTasks.get('user'));
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