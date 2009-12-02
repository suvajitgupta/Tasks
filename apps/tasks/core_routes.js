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
  detailTaskID: null,

  registerRoutes: function() {
    SC.routes.add('project', Tasks, 'routeToProject');
    SC.routes.add('task', Tasks, 'routeToTask');
    SC.routes.add('help', Tasks, 'routeToHelp');
    SC.routes.add(':', Tasks, 'routeDefault'); // the catch-all case that happens if nothing else matches
  },

  /**
    At startup, select specified project on route
  */
  routeToProject: function(params) {
    if(SC.none(params.name)) {
      console.log("Error: missing project name for URL routing");
    }
    else {
      Tasks.set('defaultProjectName', params.name);
      Tasks.restart();
    }
  },
  
  /**
    Show details of specified task on route
  */
  routeToTask: function(params) {
    Tasks._closeMainPage();
    if(SC.none(params.ID)) {
      console.log("Error: missing task ID for URL routing");
    }
    else {
      Tasks.set('detailTaskID', params.ID);
      Tasks.getPath('taskPage.mainPane').append();
    }
  },
  
  /**
    Show online help skipping authentication
  */
  routeToHelp: function(params) {
    Tasks._closeMainPage();
    Tasks.getPath('helpPage.mainPane').append();
  },
  
  /**
    Close main page if already logged in
  */
  _closeMainPage: function() {
    if(CoreTasks.get('currentUser')) { // logged in, so close
      var mainPage = Tasks.getPath('mainPage.mainPane');
      if(mainPage) {
        mainPage.remove();
        mainPage.destroy();
      }
    }
  },
  
  /**
    The catch-all case that gets fired if nothing else matches
  */
  routeDefault: function(params) {
    // Enter the statechart.
    Tasks.goState('a', 1);
  }
  
});
