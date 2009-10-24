//============================================================================
// Tasks.SIGNUP
//============================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('core');
sc_require('lib/sha1');
sc_require('views/user_information');

/**

  This will serve as the responder to all signup actions
  
  @extends SC.Responder
  @author Joshua Holt [JH2]
  @version preBeta
  @since preBeta

*/

Tasks.SIGNUP = SC.Responder.create(Tasks.Sha1,{
  
  _newUser: null,
  
  // when we become first responder, always show the signup panel
  didBecomeFirstResponder: function() {
    // Create a new user and start editing its properties.
    var newUserHash = SC.clone(CoreTasks.User.NEW_USER_HASH);
    newUserHash.role = CoreTasks.USER_ROLE_GUEST;
    this._newUser = CoreTasks.createRecord(CoreTasks.User, newUserHash);
    Tasks.signupController.set('content', this._newUser);
    
    var pane = Tasks.getPath('signupPage.mainPane');
    pane.append();
    pane.makeFirstResponder(pane.contentView.userInformation.loginNameField);
  },
  
  // called when the OK button is pressed.
  submit: function() {
    Tasks.signupController.set('password',this.sha1ify());
    
    // Save the new user
    Tasks.saveData();
    Tasks.signupController.set('content', null);
    Tasks.getPath('signupPage.mainPane').remove();
    this._refocusLoginPanel();
  },
  
  // called when the Cancel button is pressed
  cancel: function() {
    
    // Discard new user since signup was abandoned
    if(this._newUser) {
      this._newUser.destroy();
      this._newUser = null;
    }
    Tasks.signupController.set('content', null);

    // Go back to login screen
    Tasks.getPath('signupPage.mainPane').remove();
    this._refocusLoginPanel();
  },
  
  _refocusLoginPanel: function() {
    var panel = Tasks.getPath('loginPage.panel');
    if(panel) panel.focus();
  },
  
  sha1ify: function() {
    var ret;
    var userLogin = Tasks.signupController.get('loginName');
    var userPassword = Tasks.signupController.get('password');
    if (userLogin && userPassword) {
      ret = this.sha1Hash('--%@--%@--'.fmt(userLogin, userPassword));
    }else{
      ret = "";
    }
    return ret;
  }
  
});