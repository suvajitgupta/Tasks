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
      
      var currentUser = CoreTasks.get('currentUser');
      // FIXME: [SG] Beta: see why this doesn't recompute after logout or role change via User Manager
      console.log("DEBUG: in isSaveable() for user: " + currentUser);
      if(!currentUser || currentUser.get('role') === CoreTasks.USER_ROLE_GUEST) return false;
      
      return true;
      
    }.property('CoreTasks.currentUser.role').cacheable()
    
});
