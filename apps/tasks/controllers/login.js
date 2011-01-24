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
  
    loginName: '',
    password: '',
    
    loginErrorMessage: '',
    displayLoginError: function(errorMessage){
      this.set('loginErrorMessage', errorMessage);
    },
    _loginInformationDidChange: function() {
      this.set('loginErrorMessage', '');
    }.observes('loginName', 'password')
    
});
