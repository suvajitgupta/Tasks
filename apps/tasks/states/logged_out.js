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
    
    loginGuest: function() {
      Tasks.loginController.set('loginName', 'guest');
      Tasks.statechart.gotoState('logIn');
      Tasks.statechart.sendEvent('signin');
    },
    
    loginUser: function() {
      Tasks.statechart.gotoState('logIn');
    }
    
  }),
  
  // State prompting an existing user to sign up or sign in
  logIn: Ki.State.design({
    
    initialSubstate: 'ready',
    
    enterState: function() {
      Tasks.loginController.openPanel();
    },

    // State to manage sign up or sign in
    ready: Ki.State.design({
      
      signup: function() {
        Tasks.statechart.gotoState('signUp');
      },

      signin: function() {
        Tasks.statechart.gotoState('authentication');
      }
      
    }),

    // System state to manage user authentication
    // TODO: [SG] add Authentication substate entry via ready.signinAsGuest() for view route
    authentication: Ki.State.design({
      
      enterState: function() {
        Tasks.loginController.signin();
      },

      authenticationSucceeded: function() {
        Tasks.statechart.gotoState('loggedIn');
      },
      
      authenticationFailed: function() {
        Tasks.statechart.gotoState('loggedOut.logIn.ready');
      }
      
    }),
      
    exitState: function() {
      Tasks.loginController.closePanel();
    }

  }),

  // State prompting a new guest user to register
  signUp: Ki.State.design({
    
    initialSubstate: 'ready',
    
    enterState: function() {
      Tasks.signupController.openPanel();
    },

    // State to manage guest sign up
    ready: Ki.State.design({
      
      signup: function() {
        Tasks.statechart.gotoState('registration');
      },

      cancel: function() {
        Tasks.signupController.cancel();
        Tasks.statechart.gotoState('logIn');
      }

    }),
    
    // System state to manage guest registration
    registration: Ki.State.design({
      
      enterState: function() {
        Tasks.signupController.register();
      },

      registrationSucceeded: function() {
        Tasks.statechart.gotoState('authentication');
      },
      
      registrationFailed: function() {
        Tasks.statechart.gotoState('loggedOut.signUp.ready');
      }
            
    }),
      
    exitState: function() {
      Tasks.signupController.closePanel();
    }

  })
    
});