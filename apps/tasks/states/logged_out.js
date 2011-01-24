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
      if(!Tasks.panelOpen) {
        Tasks.set('panelOpen', Tasks.LOGIN_PANEL);
        var panel = Tasks.getPath('loginPage.panel');
        panel.append();
        panel.focus();
      }
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
        var loginName = Tasks.loginController.get('loginName');
        var password = Tasks.loginController.get('password');
        if (loginName !== null && loginName !== '') {
          var hashedPassword = (password === ''? '' : Tasks.userController.hashPassword(password));
          Tasks.authenticate(loginName, hashedPassword);
        }
      },

      authenticationSucceeded: function() {
        Tasks.statechart.gotoState('loggedIn');
      },
      
      authenticationFailed: function() {
        Tasks.statechart.gotoState('loggedOut.logIn.ready');
      }
      
    }),
      
    exitState: function() {
      Tasks.getPath('loginPage.panel').remove();
      Tasks.set('panelOpen', null);
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