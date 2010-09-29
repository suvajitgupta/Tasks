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
  
  loginNameErrorMessage: '',
  unhashedPassword: '',
  
  isValidUserName: function() {
    var name = this.get('name');
    if(name === '' || name === CoreTasks.NEW_USER_NAME || name === CoreTasks.NEW_USER_NAME.loc()) return false;
    var loginName = this.get('loginName');
    if(loginName === '' || loginName === CoreTasks.NEW_USER_LOGIN_NAME || loginName === CoreTasks.NEW_USER_LOGIN_NAME.loc()) return false;
    return true;
  }.property('name', 'loginName').cacheable(),
  
  displayLoginNameError: function(){
    this.set('loginNameErrorMessage', "_LoginNameInUse".loc());
  },
  
  _loginNameHasChanged: function() {
    this.set('loginNameErrorMessage', '');
  }.observes('.content.loginName')
  
  
});
