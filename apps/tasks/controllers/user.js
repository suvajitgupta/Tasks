// ==========================================================================
// Tasks.userController

// ==========================================================================
/*globals Tasks */

/** 

  This controller tracks the selected User

  @extends SC.ObjectController
	@author Suvajit Gupta
*/
Tasks.userController = SC.ObjectController.create(
/** @scope Tasks.userController.prototype */ {
  
  contentBinding: 'Tasks.usersController.selection'

});
