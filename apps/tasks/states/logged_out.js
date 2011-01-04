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
  ready: Ki.State.design(),
  
  // State prompting an existing user to log in
  logIn: Ki.State.design({
    
    enterState: function() {
      CoreTasks.initializeStore();
      Tasks.loginController.openPanel();
    },

    login: function() {
      Tasks.loginController.login();
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
    },

    exitState: function() {
      Tasks.signupController.closePanel();
    }

  })
    
});