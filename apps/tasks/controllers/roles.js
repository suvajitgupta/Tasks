// ==========================================================================
// Tasks.rolesController
// ==========================================================================
/*globals Tasks */
/** 
  This is the controller for the User Manager source list view
  
  @extends SC.TreeController
  @author Suvajit Gupta
*/

Tasks.rolesController = SC.TreeController.create(
/** @scope Tasks.rolesController.prototype */ {
  contentBinding: 'Tasks.usersController.roles',
  allowsEmptySelection: YES,
  treeItemIsGrouped: YES
});
