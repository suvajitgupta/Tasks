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
  
  // State prompting an existing user to sign in
  logIn: Ki.State.design({
    
    enterState: function() {
      CoreTasks.initializeStore();
      Tasks.loginController.openPanel();
    },

    signin: function() {
      Tasks.loginController.signin();
    },

    signup: function() {
      Tasks.statechart.gotoState('signUp');
    },

    exitState: function() {
      Tasks.loginController.closePanel();
    }

  }),

  // State prompting a new guest user to sign up
  signUp: Ki.State.design({
    
    enterState: function() {
      Tasks.signupController.openPanel();
    },

    signup: function() {
      Tasks.signupController.signup();
    },

    cancel: function() {
      Tasks.signupController.cancel();
      Tasks.statechart.gotoState('logIn');
    },

    exitState: function() {
      Tasks.signupController.closePanel();
    }

  }),
  
  authenticated: function() {
    Tasks.statechart.gotoState('loggedIn');
  }
    
});