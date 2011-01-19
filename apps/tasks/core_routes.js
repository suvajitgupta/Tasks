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
  authenticationNeeded: true,

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
    // console.log('DEBUG: helpRoute()');
    if(Tasks._checkLoginStatus()) {
      Tasks.authenticationNeeded = false;
      Tasks.getPath('helpPage.mainPane').append();
    }
  },
  
  /**
    View all tasks that match selection criteria after automatically logging in
    
    Example:
      'http://[host]/tasks#view&search=#321' would log in as 'guest' user and set search filter to '#321'.
    
  */
  viewRoute: function(params) {

    if(params.search) params.search = Tasks._unescape(params.search);
    // console.log('EBUG: viewRoute() search=' + params.search);
    Tasks.authenticationNeeded = false;
    
    if(Tasks._checkLoginStatus()) {
      if(!SC.none(params.search) && params.search !== '') {
        Tasks.filterSearchController.set('tasksSearch', params.search);
      }
      Tasks.statechart.sendEvent('loginGuest');
    }
  },
  
  /**
    See if already logged in and put up an alert
  */
  _checkLoginStatus: function() {
    if(CoreTasks.get('currentUser')) { // logged in
      SC.AlertPane.warn ("_UnavailableRoute".loc());
      return false;
    }
    return true;
  },
  
  /**
    Fix Safari escaping '#' char in routes in a strange way
  */
  _unescape: function(value) {
    return value.replace(/%23/g, '#');
  },
  
  /**
    At startup, select specified project and/or set search filter criteria
    
    Example:
      'http://[host]/tasks#select&projectId=#354&display=tasks&filter=unfinished&search=[SG]' would select project with ID #354 (if it exists) upon startup and show unfinished tasks assigned to SG.
    
    Legal values of filter are: showstoppers, troubled, unfinished, unvalidated, and completed
    
  */
  selectRoute: function(params) {
    
    if(params.projectId) params.projectId = Tasks._unescape(params.projectId);
    if(params.search) params.search = Tasks._unescape(params.search);
    // console.log('DEBUG: selectRoute() loginTime=' + CoreTasks.loginTime + ', projectId=' + params.projectId + ', display=' + params.display + ', filter=' + params.filter + ', search=' + params.search);
    
    if(!SC.none(params.display) && params.display !== '') {
      params.display = params.display.toLowerCase();
      switch(params.display) {
        case 'team': Tasks.assignmentsController.set('displayMode', Tasks.DISPLAY_MODE_TEAM); break;
        case 'tasks': Tasks.assignmentsController.set('displayMode', Tasks.DISPLAY_MODE_TASKS); break;
        default: console.warn('Illegal URL route value for display: ' + params.display);
      }
    }
    if(!SC.none(params.filter) && params.filter !== '') {
      params.filter = params.filter.toLowerCase();
      switch(params.filter) {
        case 'showstoppers': Tasks.filterSearchControllersetAttributeFilterShowstoppers(); break;
        case 'troubled': Tasks.filterSearchController.setAttributeFilterTroubled(); break;
        case 'unfinished': Tasks.filterSearchController.setAttributeFilterUnfinished(); break;
        case 'unvalidated': Tasks.filterSearchController.setAttributeFilterUnvalidated(); break;
        case 'completed': Tasks.filterSearchController.setAttributeFilterCompleted(); break;
        default: console.warn('Illegal URL route value for filter: ' + params.filter);
      }
    }
    if(!SC.none(params.search) && params.search !== '') {
      Tasks.filterSearchController.set('tasksSearch', params.search);
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
      var project = CoreTasks.getProjectById(defaultProjectId); // see if such a project exists
      if(!project) {
        console.warn('selectRoute(): No project of ID #' + defaultProjectId);
        project = CoreTasks.get('allTasksProject');
      }
      if(project !== this.get('defaultProject')) {
        this.set('defaultProject', project);
        var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
        if(project !== selectedProject) this.projectsController.selectObject(project);
      }
    }
  },
  
  /**
    The catch-all case when no routes are specified
  */
  defaultRoute: function(params) {
    // console.log('DEBUG: defaultRoute()');
    if(!CoreTasks.get('currentUser') && Tasks.get('authenticationNeeded')) Tasks.statechart.sendEvent('loginUser');
  }
  
});
