// ==========================================================================
// Tasks Routes:
// Contains handlers for special URL routing
// ==========================================================================
/*globals Tasks CoreTasks sc_require */

sc_require('core');

/** @mixin
    @extends Tasks
    @author Jonathan Lewis
    @author Suvajit Gupta
  
  This mixin handles all the routing for Tasks.  Routes parse custom URL parameters
  to go straight to particular sections of the application.  They support bookmarking and
  browser history.
  
  For example:
    'http://[host]/tasks#project&name=MyProject' would select MyProject upon startup (if it exists).
    
*/
Tasks.mixin( /** @scope Tasks */ {
  
  defaultProjectName: null,
  defaultProject: null,

  registerRoutes: function() {
    SC.routes.add('project', Tasks, 'routeToProject');
    SC.routes.add('help', Tasks, 'routeToHelp');
    SC.routes.add(':', Tasks, 'routeDefault'); // the catch-all case that happens if nothing else matches
  },

  /**
    Select specified project on route
  */
  routeToProject: function(params) {
    if(SC.none(params.name)) {
      console.log("Error: missing project name for URL routing");
    }
    else {
      this.set('defaultProjectName', params.name);
      this.restart();
    }
  },
  
  
  /**
    Show online help skipping authentication
  */
  routeToHelp: function(params) {
    Tasks.getPath('helpPage.mainPane').append();
  },
  
  
  /**
    The catch-all case that gets fired if nothing else matches
  */
  routeDefault: function(params) {
    // Enter the statechart.
    Tasks.goState('a', 1);
  }
  
});
