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
      
*/
Tasks.mixin( /** @scope Tasks */ {
  
  defaultProjectName: null,
  defaultProject: null,

  registerRoutes: function() {
    SC.routes.add('help', Tasks, 'routeToHelp');
    SC.routes.add('task', Tasks, 'routeToTask');
    SC.routes.add('project', Tasks, 'routeToProject');
    SC.routes.add(':', Tasks, 'routeDefault'); // the catch-all case that happens if nothing else matches
  },

  /**
    Show online help skipping authentication
    
    Format:
      'http://[host]/tasks#help' would show online help without requiring user authentication.
    
  */
  routeToHelp: function(params) {
    Tasks._closeMainPage();
    Tasks.getPath('helpPage.mainPane').append();
  },
  
  /**
    Show details of specified task on route
    
    Example:
      'http://[host]/tasks#task&IDs=#321, #422' would log in as special 'guest' user and set search filter to '#321, #422'.
    
  */
  routeToTask: function(params) {
    Tasks._closeMainPage();
    if(SC.none(params.IDs)) {
      console.log("Error: missing task ID(s) for URL routing");
    }
    else {
      // Enter the statechart.
      Tasks.goState('a', 1);
      Tasks.authenticate('guest', '');
      Tasks.assignmentsController.set('searchFilter', params.IDs);
    }
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
    At startup, select specified project on route
    
    Example:
      'http://[host]/tasks#project&name=MyProject' would select MyProject upon startup (if it exists).
    
  */
  routeToProject: function(params) {
    if(SC.none(params.name)) {
      console.log("Error: missing project name for URL routing");
    }
    else if(this.loginTime) {
      Tasks.set('defaultProjectName', params.name);
      Tasks.restart();
    }
    else {
      var project = CoreTasks.getProject(params.name); // see if such a project exists
      if(project && project !== this.get('defaultProject')) {
        this.set('defaultProject', project);
        this.projectsController.selectObject(project);
      }
    }
  },
  
  /**
    The catch-all case that gets fired if nothing else matches
  */
  routeDefault: function(params) {
    if(this.loginTime) {
      // Enter the statechart.
      Tasks.goState('a', 1);
      Tasks.loginController.openPanel();
    }
  }
  
});
