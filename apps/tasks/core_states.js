/**
 * A mixin that defines all of the state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks sc_require */
sc_require('core');

Tasks.mixin({
  
  // Login
  goStateA1: function(){
    // var loginName = "bigboss";
    var loginName = prompt("Login name:"); // TODO: [SG] replace with real Login dialog
    if (loginName !== null && loginName !== '') {
      Tasks.authenticate(loginName, 'password'); // TODO: [SG] pass actual password input by user
    }
  },

  // Authentication
  goStateA2: function(){
    // TODO: [SG] implement user authentication
  },

  // Data Loading
  goStateA3: function(){
    // Instantiate Views
    Tasks.getPath('mainPage.mainPane').append();
  },

  // Project/Task Management
  goStateA4: function(){
    // Select first project at startup
    Tasks.getPath('mainPage.mainPane').get('projectsList').select(0);
  }

});