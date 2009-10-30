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
    Tasks.loginController.openPanel();
  },

  // Authentication
  goStateA2: function(){
    // TODO: [SG] Beta: integrate server-based user authentication
  },

  // Data Loading
  goStateA3: function(){
    // Select first user at startup
    Tasks.getPath('settingsPage.panel.usersList').select(0);
    Tasks.getPath('mainPage.mainPane').append();
  },

  // Project/Task Management
  goStateA4: function(){
    // Select appropriate project at startup
    var defaultProject = this.get('defaultProject');
    if(defaultProject) this.projectsController.selectObject(defaultProject);
  }

});