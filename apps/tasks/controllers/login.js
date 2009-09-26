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
      this._panelOpen = false;
      var panel = Tasks.getPath('loginPage.panel');
      if(panel) {
        panel.remove();
        panel.destroy();
      }
    },
    
    login: function() {
      var loginName = this.get('loginName');
      if (loginName !== null && loginName !== '') {
        Tasks.authenticate(loginName, 'password'); // TODO: [SG] get password from user
      }
    },
    
    displayLoginError: function(){
      this.set('loginError', true);
    },
    
    cancel: function() {
      this.closePanel();
      Tasks.mainPage.get('mainPane').removeAllChildren();
    },
    
    _loginNameHasChanged: function() {
      this.set('loginError', false);
    }.observes('loginName')
    
});
