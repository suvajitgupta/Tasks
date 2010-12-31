//============================================================================
// ==========================================================================
// Tasks.signupController
// ==========================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('core');
sc_require('views/user_information');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for signing up a guest user.
*/
Tasks.signupController = SC.ObjectController.create(
/** @scope Tasks.signupController.prototype */ {
  
  _newUser: null,
  
  openPanel: function() {
    // Create a new user and start editing its properties.
    var newUserHash = SC.clone(CoreTasks.User.NEW_USER_HASH);
    newUserHash.role = CoreTasks.USER_ROLE_GUEST;
    this._newUser = CoreTasks.createRecord(CoreTasks.User, newUserHash);
    Tasks.usersController.selectObject(this._newUser);
    
    var pane = Tasks.getPath('signupPage.mainPane');
    pane.append();
    pane.makeFirstResponder(pane.contentView.userInformation.fullNameField);
  },
  
  signup: function() {
    // console.log('DEBUG: Signup.submit() loginName=' + Tasks.userController.get('loginName'));
    var params = {
      successCallback: this._loginNameUnavailable.bind(this),
      failureCallback: this._loginNameAvailable.bind(this)
    };
    params.queryParams = { 
      loginName: "'%@'".fmt(Tasks.userController.get('loginName'))
    };
    CoreTasks.executeTransientGet('user', undefined, params);
  },
    
  /**
   * Called if loginName is avaliable for signup.
   */
  _loginNameAvailable: function(response) {
    // console.log('DEBUG: loginNameAvailable() response=' + response);
    Tasks.userController.clearLoginNameError();
    var loginName = Tasks.userController.get('loginName');
    Tasks.set('loginName', loginName);
    var password = Tasks.userController.get('unhashedPassword');
    Tasks.userController.set('password', Tasks.userController.hashPassword(password));
    Tasks.saveData();
    Tasks.usersController.set('selection', '');
    Tasks.getPath('signupPage.mainPane').remove();
    Tasks.authenticate(loginName, Tasks.userController.hashPassword(password));
  },
  
  /**
   * Called if loginName is already taken.
   */
  _loginNameUnavailable: function(response) {
    Tasks.userController.displayLoginNameError();
  },
  
  // called to abort signup
  cancel: function() {
    // Discard new user since signup was abandoned
    if(this._newUser) {
      this._newUser.destroy();
      this._newUser = null;
    }
    Tasks.usersController.set('selection', '');
    Tasks.statechart.gotoState('logIn');
  },

  closePanel: function() {
    // Close signup panel and refocus on login panel
    Tasks.getPath('signupPage.mainPane').remove();
    var panel = Tasks.getPath('loginPage.panel');
    if(panel) panel.focus();
  }
    
});