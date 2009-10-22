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
        panel.append();
        var listView = Tasks.getPath('settingsPage.panel.usersList');
        listView.select(0);
      }
    },
    
    closePanel: function(){
      var panel = Tasks.getPath('settingsPage.panel');
      if(panel) {
        panel.remove();
        panel.destroy();
      }
    }
    
    // FIXME: [SG] Beta: how to keep currently selected user in place when name is changed and its position moves in list?
    
});