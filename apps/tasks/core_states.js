/**
 * A mixin that defines all of the state transitions.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki sc_require */
sc_require('core');

Tasks.mixin({
  
  statechart: Ki.Statechart.create({

    rootState: Ki.State.design({

      initialSubstate: 'loggedOut',

      loggedOut: Ki.State.design({

        initialSubstate: 'logIn',
        
        logIn: Ki.State.design({
          
          enterState: function() {
            console.info('Ki enter: loggedOut.logIn');
            Tasks.loginController.openPanel();
          },

          login: function() {
            console.info('Ki action: loggedOut.logIn.login()');
            Tasks.loginController.login();
          },

          signup: function() {
            console.info('Ki action: loggedOut.logIn.signup()');
            Tasks.statechart.gotoState('signUp');
          },

          exitState: function() {
            console.info('Ki  exit: loggedOut.logIn');
            Tasks.loginController.closePanel();
          }

        }),

        signUp: Ki.State.design({
          
          enterState: function() {
            console.info('Ki enter: loggedOut.signUp');
            Tasks.signupController.openPanel();
          },

          signup: function() {
            console.info('Ki action: loggedOut.signUp.signup()');
            Tasks.signupController.signup();
          },

          cancel: function() {
            console.info('Ki action: loggedOut.signUp.cancel()');
            Tasks.signupController.cancel();
          },

          exitState: function() {
            console.info('Ki  exit: loggedOut.signUp');
            Tasks.signupController.closePanel();
          }

        }),

        enterState: function() {
          console.info('Ki enter: loggedOut');
          Tasks.loginController.openPanel();
        },

        exitState: function() {
          console.info('Ki  exit: loggedOut');
          Tasks.loginController.closePanel();
        }

      }),

      loggedIn: Ki.State.design({

        enterState: function() {
          console.info('Ki enter: loggedIn');
        },

        logout: function() {
          console.info('Ki action: loggedIn.logout()');
          Tasks.logout();
        },

        exitState: function() {
          console.info('Ki  exit: loggedIn');
        }
        
      })

    })

  }),
  
  // Login
  goStateA1: function() {
  },

  // Authentication
  goStateA2: function() {
  },

  // Data Loading
  goStateA3: function() {
    Tasks.loadData();
  },

  // Ready for User Interaction
  goStateA4: function() {
    Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
  }

});