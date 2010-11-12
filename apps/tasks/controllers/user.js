// ==========================================================================
// Tasks.userController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */
sc_require('lib/sha1');

/** 

  This controller tracks the selected User

  @extends SC.ObjectController
	@author Suvajit Gupta
*/
Tasks.userController = SC.ObjectController.create(Tasks.Sha1,
/** @scope Tasks.userController.prototype */ {
  
  contentBinding: SC.Binding.oneWay('Tasks.usersController.selection'),
  
  loginNameErrorMessage: '',
  emailErrorMessage: '',
  unhashedPassword: '',
  
  isValidUserName: function() {
    var name = this.get('name');
    if(name === '' || name === CoreTasks.NEW_USER_NAME || name === CoreTasks.NEW_USER_NAME.loc()) return false;
    var loginName = this.get('loginName');
    if(loginName === '' || loginName === CoreTasks.NEW_USER_LOGIN_NAME || loginName === CoreTasks.NEW_USER_LOGIN_NAME.loc()) return false;
    return true;
  }.property('name', 'loginName').cacheable(),
  
  displayLoginNameError: function() {
    this.set('loginNameErrorMessage', "_InUse".loc());
  },
  clearLoginNameError: function() {
    this.set('loginNameErrorMessage', '');
  },

  displayEmailError: function() {
    this.set('emailErrorMessage', "_Invalid".loc());
  },
  clearEmailError: function() {
    this.set('emailErrorMessage', '');
  },

  _emailHasChanged: function() {
    this.set('emailErrorMessage', '');
  }.observes('.content.email'),
  
  _loginNameHasChanged: function() {
    this.set('loginNameErrorMessage', '');
  }.observes('.content.loginName'),
  
  _unhashedPassword: '',
  unhashedPassword: function(key, value) {
    if (value !== undefined) {
      this._unhashedPassword = value;
      this.set('password', Tasks.userController.hashPassword(value));
    } else {
      return this._unhashedPassword;
    }
  }.property('_unhashedPassword').cacheable(),
  
  hashPassword: function(password) {
    return password? this.sha1Hash(password) : '';
  },
  
  _contentHasChanged: function() {
    var user = this.getPath('content.firstObject');
    if(user) {
      var password = user.get('password');
      this._unhashedPassword = password? 'password' : '';
    }
  }.observes('content')
  
});
