/**
 * A state to manage user login & signup.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki sc_require */

Tasks.LoggedOutState = Ki.State.extend({

  initialSubstate: 'routing',
  
  // Initial state from which application is 'routed' to appropriate place
  routing: Ki.State.design({
    
    loginGuest: function() {
      Tasks.loginController.set('loginName', 'guest');
      Tasks.statechart.gotoState('showingLoginPanel');
      Tasks.statechart.sendEvent('signin');
    },
    
    loginUser: function() {
      Tasks.statechart.gotoState('showingLoginPanel');
    }
    
  }),
  
  // State prompting an existing user to sign up or sign in
  showingLoginPanel: Ki.State.design({
    
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
        Tasks.statechart.gotoState('showingSignupPanel');
      },

      signin: function() {
        Tasks.statechart.gotoState('authentication');
      }
      
    }),

    // System state to manage user authentication
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
        Tasks.statechart.gotoState('loggedOut.showingLoginPanel.ready');
      }
      
    }),
      
    exitState: function() {
      Tasks.getPath('loginPage.panel').remove();
      Tasks.set('panelOpen', null);
    }

  }),

  // State prompting a new guest user to register
  showingSignupPanel: Ki.State.design({
    
    initialSubstate: 'ready',
    
    enterState: function() {
      Tasks.signupController.createUser();
      var pane = Tasks.get('signupPane');
      pane.append();
      pane.makeFirstResponder(pane.contentView.userInformation.fullNameField);
    },

    // State to manage guest sign up
    ready: Ki.State.design({
      
      signup: function() {
        Tasks.statechart.gotoState('registration');
      },

      cancel: function() {
        Tasks.signupController.deleteUser();
        Tasks.statechart.gotoState('showingLoginPanel');
      }

    }),
    
    // System state to manage guest registration
    registration: Ki.State.design({
      
      enterState: function() {
        Tasks.signupController.registerUser();
      },

      registrationSucceeded: function() {
        Tasks.statechart.gotoState('authentication');
      },
      
      registrationFailed: function() {
        Tasks.statechart.gotoState('loggedOut.showingSignupPanel.ready');
      }
            
    }),
      
    exitState: function() {
      Tasks.userController.clearLoginNameError();
      Tasks.get('signupPane').remove();
    }

  })
    
});