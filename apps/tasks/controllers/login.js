// ==========================================================================
// Tasks.ImportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for logging in user.
*/
Tasks.loginController = SC.ObjectController.create(
/** @scope Orion.loginController.prototype */ {
  
    _panelOpen: false,
    loginError: false,
    loginName: '',
    
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
      var panel = Tasks.getPath('loginPage.panel');
      panel.remove();
      panel.destroy();
      this._panelOpen = false;
    },
    
    login: function() {
      var loginName = this.get('loginName');
      if (loginName !== null && loginName !== '') {
        Tasks.authenticate(loginName, 'password'); // TODO: [SG] get password from user
      }
    },
    
    displayLoginError: function(){
      this.set('loginError', true);
    }
    
});
