// ==========================================================================
// Tasks.userController

// ==========================================================================
/*globals Tasks sc_require */
sc_require('lib/sha1');

/** 

  This controller tracks the selected User

  @extends SC.ObjectController
	@author Suvajit Gupta
*/
Tasks.userController = SC.ObjectController.create(Tasks.Sha1,
/** @scope Tasks.userController.prototype */ {
  
  contentBinding: 'Tasks.usersController.selection',
  
  hashPassword: function(password) {
    return password? this.sha1Hash(password) : '';
  }

});
