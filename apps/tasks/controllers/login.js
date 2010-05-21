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
  
    _panelOpen: false,
    loginError: false,
    loginName: '',
    password: '',
    
    openPanel: function(){
      if(this._panelOpen) return;
      this._panelOpen = true;
      var panel = Tasks.getPath('loginPage.panel');
      if(panel) {
        panel.append();
        panel.focus();
      }
    },
    
    closePanel: function(){
      this._panelOpen = false;
      var panel = Tasks.getPath('loginPage.panel');
      if(panel) {
        panel.remove();
      }
    },
    
    login: function() {
      var loginName = this.get('loginName');
      var password = this.get('password');
      if (loginName !== null && loginName !== '') {
        Tasks.authenticate(loginName, Tasks.userController.hashPassword(password));
      }
    },
    
    displayLoginError: function(){
      this.set('loginError', true);
    },
    
    _loginInformationHasChanged: function() {
      this.set('loginError', false);
    }.observes('loginName', 'password')
    
});
