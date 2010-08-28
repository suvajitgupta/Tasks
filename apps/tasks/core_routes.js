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
    SC.routes.add('help', Tasks, 'helpRoute');
    SC.routes.add('view', Tasks, 'viewRoute');
    SC.routes.add('select', Tasks, 'selectRoute');
    SC.routes.add(':', Tasks, 'defaultRoute'); // the catch-all case that happens if nothing else matches
  },

  /**
    Show online help skipping authentication
    
    Format:
      'http://[host]/tasks#help' would show online help without requiring user authentication.
    
  */
  helpRoute: function(params) {
    Tasks._closeMainPage();
    Tasks.getPath('helpPage.mainPane').append();
  },
  
  /**
    View all tasks that match selection criteria after automatically logging in
    
    Example:
      'http://[host]/tasks#view&search=#321' would log in as 'guest' user and set search filter to '#321'.
    
  */
  viewRoute: function(params) {
    console.log('DEBUG: viewRoute() search=' + params.search);
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
    At startup, select specified project and/or set search filter criteria
    
    Example:
      'http://[host]/tasks#select&projectId=#354&search=[SG]' would select project with ID #354 (if it exists) upon startup and show tasks assigned to 'SG'.
    
  */
  selectRoute: function(params) {
    console.log('DEBUG: selectRoute() loginTime=' + CoreTasks.loginTime + ', projectId=' + params.projectId + ', search=' + params.search);
    if(!SC.none(params.search) && params.search !== '') {
      Tasks.assignmentsController.set('searchFilter', params.search);
    }
    var defaultProjectId = null;
    if(!SC.none(params.projectId) && params.projectId !== '') {
      defaultProjectId = params.projectId.replace('#', '');
    }
    if(CoreTasks.loginTime) {
      if(defaultProjectId) Tasks.set('defaultProjectId', defaultProjectId);
      Tasks.defaultRoute();
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
    The catch-all case when no routes are specified
  */
  defaultRoute: function(params) {
    if(CoreTasks.loginTime) {
      // Enter the statechart.
      Tasks.goState('a', 1);
      Tasks.loginController.openPanel();
    }
  }
  
});
