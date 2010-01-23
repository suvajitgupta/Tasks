// ==========================================================================
// Tasks.signupController
// ==========================================================================
/*globals Tasks CoreTasks*/

/** 

  This controller tracks a user signing up

  @extends SC.ObjectController
	@author Suvajit Gupta
*/
Tasks.signupController = SC.ObjectController.create(
/** @scope Tasks.signupController.prototype */ {
  
  unhashedPassword: '',
  
  isValidUserName: function() {
    var name = this.get('name');
    if(name === CoreTasks.NEW_USER_NAME) return false;
    var loginName = this.get('loginName');
    if(loginName === CoreTasks.NEW_USER_LOGIN_NAME) return false;
    return true;
  }.property('name', 'loginName').cacheable()
  
});
