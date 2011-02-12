//============================================================================
// ==========================================================================
// Tasks.signupController
// ==========================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('views/user_information');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for signing up a guest user.
*/
Tasks.signupController = SC.ObjectController.create(
/** @scope Tasks.signupController.prototype */ {
  
  _registeringUser: null,
  
  /**
   * Create a new guest user and select it for editing.
   */
  createUser: function() {
    var newUserHash = SC.clone(CoreTasks.User.NEW_USER_HASH);
    newUserHash.role = CoreTasks.USER_ROLE_GUEST;
    this._registeringUser = CoreTasks.createRecord(CoreTasks.User, newUserHash);
    Tasks.usersController.selectObject(this._registeringUser);
  },
  
  /**
   * Register new guest user with Server.
   */
  registerUser: function() {
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
        Tasks.statechart.sendEvent('registrationFailed');
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
    Tasks.loginController.set('loginName', Tasks.userController.get('loginName'));
    Tasks.loginController.set('password', Tasks.userController.get('unhashedPassword'));
    Tasks.saveChanges();
    Tasks.statechart.sendEvent('registrationSucceeded');
  },
  
  /**
   * Delete guest user when canceling signup.
   */
  deleteUser: function() {
    // Discard new user since signup was abandoned
    if(this._registeringUser) {
      this._registeringUser.destroy();
      this._registeringUser = null;
      Tasks.usersController.set('selection', '');
    }
  }
    
});