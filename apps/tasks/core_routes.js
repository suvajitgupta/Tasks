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
  
  defaultProjectID: null,
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
    Search for tasks via route
    
    Example:
      'http://[host]/tasks#task&search=#321' would log in as special 'guest' user and set search filter to '#321'.
    
  */
  routeToTask: function(params) {
    console.log('DEBUG: routeToTask() search=' + params.search);
    Tasks._closeMainPage();
    if(SC.none(params.search) || params.search === '') {
      console.warn("Missing task search for URL routing");
    }
    else {
      // Enter the statechart.
      Tasks.goState('a', 1);
      Tasks.authenticate('guest', '');
      Tasks.assignmentsController.set('searchFilter', params.search);
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
      }
    }
  },
  
  /**
    At startup, select specified project on route
    
    Example:
      'http://[host]/tasks#project&ID=#555' would select project with ID #555 upon startup (if it exists).
    
  */
  routeToProject: function(params) {
    // console.log('DEBUG: routeToProject() loginTime=' + CoreTasks.loginTime + ', projectID=' + params.ID);
    var defaultProjectId = null;
    if(SC.none(params.ID) || params.ID === '') {
      console.warn("Missing project ID for URL routing");
    }
    else {
      defaultProjectId = params.ID.replace('#', '');
    }
    
    if(CoreTasks.loginTime) {
      if(defaultProjectId) Tasks.set('defaultProjectId', defaultProjectId);
      Tasks.routeDefault();
    }
    else if(defaultProjectId) {
      var project = CoreTasks.store.find(CoreTasks.Project, defaultProjectId); // see if such a project exists
      if(!project) {
        console.warn("No project of ID #" + defaultProjectId);
        project = CoreTasks.get('allTasksProject');
      }
      if(project !== this.get('defaultProject')) {
        this.set('defaultProject', project);
        this.projectsController.selectObject(project);
      }
    }

  },
  
  /**
    The catch-all case that gets fired if nothing else matches
  */
  routeDefault: function(params) {
    if(CoreTasks.loginTime) {
      // Enter the statechart.
      Tasks.goState('a', 1);
      Tasks.loginController.openPanel();
    }
  }
  
});
