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
  
    loginName: '',
    
    openPanel: function(){
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
    },
    
    login: function() {
      var loginName = this.get('loginName');
      if (loginName !== null && loginName !== '') {
        Tasks.authenticate(loginName, 'password'); // TODO: [SG] pass actual password input by user
      }
      this.closePanel();
    }
    
});
