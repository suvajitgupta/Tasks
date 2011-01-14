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
  
    loginErrorMessage: '',
    loginName: '',
    password: '',
    
    openPanel: function() {
      // console.log('DEBUG: loginController.openPanel() panelOpen=' + Tasks.panelOpen);
      if(Tasks.panelOpen === Tasks.LOGIN_PANEL) return;
      Tasks.set('panelOpen', Tasks.LOGIN_PANEL);
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
      Tasks.set('panelOpen', null);
    },
    
    signin: function() {
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
