/**
 * A state to manage interactions of a logged in user.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki sc_require */

Tasks.LoggedInState = Ki.State.extend({

  enterState: function() {
    Tasks.loadData();
    Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
  },

  logout: function() {
    Tasks.logout();
  }
      
});