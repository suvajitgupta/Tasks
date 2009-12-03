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
  goStateA1: function() {
  },

  // Authentication
  goStateA2: function() {
  },

  // Data Loading
  goStateA3: function() {
    Tasks.loadData();
  },

  // Project/Task Management
  goStateA4: function() {
  }

});