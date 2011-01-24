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
    
    signin: function() {
      var loginName = this.get('loginName');
      var password = this.get('password');
      if (loginName !== null && loginName !== '') {
        var hashedPassword = (password === ''? '' : Tasks.userController.hashPassword(password));
        Tasks.authenticate(loginName, hashedPassword);
      }
    },
    
    loginErrorMessage: '',
    displayLoginError: function(errorMessage){
      this.set('loginErrorMessage', errorMessage);
    },
    _loginInformationDidChange: function() {
      this.set('loginErrorMessage', '');
    }.observes('loginName', 'password')
    
});
