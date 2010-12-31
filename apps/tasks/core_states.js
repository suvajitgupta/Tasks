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

    trace: YES,
    
    rootState: Ki.State.design({

      initialSubstate: 'loggedOut',

      loggedOut: Ki.State.design({

        initialSubstate: 'logIn',
        
        logIn: Ki.State.design({
          
          enterState: function() {
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

        }),

        enterState: function() {
          Tasks.loginController.openPanel();
        },

        exitState: function() {
          Tasks.loginController.closePanel();
        }

      }),

      loggedIn: Ki.State.design({

        enterState: function() {
          Tasks.loadData();
          Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
        },

        logout: function() {
          Tasks.logout();
        },

        exitState: function() {
        }
        
      })

    })

  })

});