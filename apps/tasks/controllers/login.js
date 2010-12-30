// ==========================================================================
// Tasks.loginController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for logging in user.
*/
Tasks.loginController = SC.ObjectController.create(
/** @scope Tasks.loginController.prototype */ {
  
    _panelOpened: false,
    loginErrorMessage: '',
    loginName: '',
    password: '',
    
    openPanel: function() {
      // console.log('DEBUG: loginController.openPanel()');
      if(this._panelOpened) return;
      this._panelOpened = true;
      var panel = Tasks.getPath('loginPage.panel');
      if(panel) {
        panel.append();
        panel.focus();
      }
    },
    
    closePanel: function() {
      // console.log('DEBUG: loginController.closePanel()');
      var panel = Tasks.getPath('loginPage.panel');
      if(panel) {
        panel.remove();
      }
      this._panelOpened = false;
    },
    
    login: function() {
      var loginName = this.get('loginName');
      var password = this.get('password');
      if (loginName !== null && loginName !== '') {
        Tasks.authenticate(loginName, Tasks.userController.hashPassword(password));
      }
    },
    
    displayLoginError: function(errorMessage){
      this.set('loginErrorMessage', errorMessage);
    },
    
    _loginInformationHasChanged: function() {
      this.set('loginErrorMessage', '');
    }.observes('loginName', 'password')
    
});
