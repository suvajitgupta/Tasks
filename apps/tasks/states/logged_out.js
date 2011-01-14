/**
 * A state to manage user login & signup.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki sc_require */

Tasks.LoggedOutState = Ki.State.extend({

  initialSubstate: 'ready',
  
  // Initial state from which it moves to logIn if authentication is needed
  ready: Ki.State.design({
    
    login: function() {
      Tasks.statechart.gotoState('logIn');
    }
        
  }),
  
  // State prompting an existing user to sign up or sign in
  logIn: Ki.State.design({
    
    enterState: function() {
      CoreTasks.initializeStore();
      Tasks.loginController.openPanel();
    },

    signup: function() {
      Tasks.statechart.gotoState('signUp');
    },

    signin: function() {
      Tasks.loginController.signin();
    },

    exitState: function() {
      Tasks.loginController.closePanel();
    }

  }),

  // State prompting a new guest user to register
  signUp: Ki.State.design({
    
    enterState: function() {
      Tasks.signupController.openPanel();
    },

    signup: function() {
      Tasks.signupController.register();
    },

    cancel: function() {
      Tasks.signupController.cancel();
      Tasks.statechart.gotoState('logIn');
    },

    exitState: function() {
      Tasks.signupController.closePanel();
    }

  }),
  
  // TODO: [SG] create Registration substate with entry via signIn.register() and exit to Authentication via registered() and exit to signUp via nameInUse()
  // TODO: [SG] create Authentication substate with entry via ready.signinAsGuest(), logIn.signin(), signUp.registered()) and exit to loggedIn via authenticated()
  authenticated: function() {
    Tasks.statechart.gotoState('loggedIn');
  }
    
});