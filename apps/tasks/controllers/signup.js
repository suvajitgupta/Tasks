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
    
    var pane = Tasks.get('signupPane');
    pane.append();
    pane.makeFirstResponder(pane.contentView.userInformation.fullNameField);
  },
  
  register: function() {
    // console.log('DEBUG: register() loginName=' + Tasks.userController.get('loginName'));
    var params = {
      successCallback: this._userFound.bind(this),
      failureCallback: this._userNotFound.bind(this)
    };
    params.queryParams = { 
      loginName: "'%@'".fmt(Tasks.userController.get('loginName'))
    };
    CoreTasks.executeTransientGet('user', undefined, params);
  },
    
  /**
   * A user with matching loginName found - see if it is soft-deleted.
   */
  _userFound: function(response) {
    // console.log('DEBUG: _userFound() count=' + response.length + ', statuses=[' + response.getEach('status') + ']');
    for(var i = 0; i < response.length; i++) {
      if(response[i].status !== 'deleted') {
        Tasks.userController.displayLoginNameError();
        return;
      }
    }
    this._registrationSuccess();
  },
  
  /**
   * No user with matching loginName found.
   */
  _userNotFound: function() {
    // console.log('DEBUG: _userNotFound()');
    this._registrationSuccess();
  },
  
  /**
   * New guest user successfully registered, login that user.
   */
  _registrationSuccess: function() {
    Tasks.userController.clearLoginNameError();
    var loginName = Tasks.userController.get('loginName');
    Tasks.set('loginName', loginName);
    var password = Tasks.userController.get('unhashedPassword');
    Tasks.userController.set('password', Tasks.userController.hashPassword(password));
    Tasks.saveChanges();
    Tasks.usersController.set('selection', '');
    Tasks.get('signupPane').remove();
    Tasks.authenticate(loginName, Tasks.userController.hashPassword(password));
  },
  
  // called to abort signup
  cancel: function() {
    // Discard new user since signup was abandoned
    if(this._newUser) {
      this._newUser.destroy();
      this._newUser = null;
    }
    Tasks.usersController.set('selection', '');
  },

  closePanel: function() {
    // Close signup panel and refocus on login panel
    Tasks.get('signupPane').remove();
    var panel = Tasks.getPath('loginPage.panel');
    if(panel) panel.focus();
  }
    
});