// ==========================================================================
// Tasks.loginController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

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
    displayLoginErrorMessage: function(errorMessage){
      this.set('loginErrorMessage', errorMessage);
    },
    clearLoginErrorMessage: function(){
      this.set('loginErrorMessage', '');
    },
    
    _loginInformationDidChange: function() {
      this.clearLoginErrorMessage();
    }.observes('loginName', 'password')
    
});
