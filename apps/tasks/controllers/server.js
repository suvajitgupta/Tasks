// ==========================================================================
// Tasks.serverController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.Object
  @author Suvajit Gupta
  
  Controller for server access.
*/
Tasks.serverController = SC.Object.create(
/** @scope Orion.serverController.prototype */ {
  
    isSaveable: function() {
      return true;
    }.property('CoreTasks.currentUser.role').cacheable()
    
});
