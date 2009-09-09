// ==========================================================================
// Tasks.helpController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for Application Settings.
*/
Tasks.helpController = SC.ObjectController.create(
/** @scope Orion.helpController.prototype */ {
  
    openPanel: function(){
      var panel = Tasks.getPath('helpPage.panel');
      if(panel) panel.append();
    },
    
    closePanel: function(){
      var panel = Tasks.getPath('helpPage.panel');
      panel.remove();
      panel.destroy();
    }
    
});