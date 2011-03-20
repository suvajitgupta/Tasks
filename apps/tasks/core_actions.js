/**
 * A mixin that defines all of the "actions" that trigger state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks SCUDS sc_require */

sc_require('controllers/users');
sc_require('controllers/projects');
sc_require('controllers/tasks');

Tasks.mixin( /** @scope Tasks */ {

  loginName: null,

  /**
   * Authenticate user trying to log in to Tasks application.
   *
   * @param {String} user's login name.
   * @param {String} user's password.
   */
  authenticate: function(loginName, password) {
    
    // console.log('DEBUG: authenticate()');
    
    Tasks.getPath('loginPage.panel').setAuthenticatingMessageVisibility(true);
    
    Tasks.set('loginName', loginName);
    if(CoreTasks.get('dataSourceType') === CoreTasks.REMOTE_DATA_SOURCE) { // perform remote authentication
      var params = {
        successCallback: this._authenticationSuccess.bind(this),
        failureCallback: this._authenticationFailure.bind(this)
      };
      return CoreTasks.User.authenticate(loginName, password, params);
    }
    else { // perform authentication with fixtures data
      for(var i = 0, len = CoreTasks.User.FIXTURES.length; i < len; i++) {
        if(loginName === CoreTasks.User.FIXTURES[i].loginName) {
          return this._authenticationSuccess();
        }
      }
      return this._authenticationFailure();
    }
    
  },
  
  /**
   * Called after successful authentication.
   */
  _authenticationSuccess: function(response, request) {

    Tasks.getPath('loginPage.panel').setAuthenticatingMessageVisibility(false);

    // See if a non-soft-deleted user was found for Server-based login
    var userHash = null;
    if(!SC.none(response)) {
      for(var i = 0; i < response.length; i++) {
        if(response[i].status !== 'deleted') {
          userHash = response[i];
          break;
        }
      }
      if(!userHash) {
        this._authenticationFailure(SC.Error.create());
        return;
      }
    }
    
    // console.log('DEBUG: _authenticationSuccess()');
    // Start GUI and setup startup defaults
    Tasks.getPath('mainPage.mainPane').append();
    Tasks.mainPageHelper.set('clippyDetails', document.getElementById(Tasks.mainPageHelper.clippyDetailsId));
    if(SC.none(request)) {
      Tasks.set('serverType', Tasks.NO_SERVER); // Fixtures mode
    }
    else {
      var headers = request.get('headers');
      if(SC.typeOf(headers) === SC.T_HASH) {
        var server = headers.server || headers.Server;
        // console.log('DEBUG: server=' + headers.server + ', Server=' + headers.Server);
        if(server && server.indexOf('Persevere') !== -1) {
          console.log('Communicating with Persevere Server');
          Tasks.set('serverType', Tasks.PERSEVERE_SERVER);
        }
        else {
          console.log('Communicating with GAE Server');
        }
      }
    }
    
    // Create system projects
    if(!CoreTasks.get('allTasksProject')) {
      var allTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.ALL_TASKS_NAME.loc()
      });
      CoreTasks.set('allTasksProject', allTasksProject);
      CoreTasks.set('needsSave', NO);
    }
    if(!CoreTasks.get('unallocatedTasksProject')) {
      var unallocatedTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.UNALLOCATED_TASKS_NAME.loc()
      });
      CoreTasks.set('unallocatedTasksProject', unallocatedTasksProject);
      CoreTasks.set('needsSave', NO);
    }
    if(!CoreTasks.get('unassignedTasksProject')) {
      var unassignedTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.UNASSIGNED_TASKS_NAME.loc()
      });
      CoreTasks.set('unassignedTasksProject', unassignedTasksProject);
      CoreTasks.set('needsSave', NO);
    }
    
    // Setup user controller and then current logged on user
    // Note: sequence is important below - logged in user must be loaded after data is preloaded from LDS to get new authToken
    // TODO: [SG] don't send private information (like email address) for users from GAE Server - these can be seen in localStorage later
    var currentUser = null;
    if (!CoreTasks.get('allUsers')) {
      CoreTasks.set('allUsers', CoreTasks.store.find(
        SC.Query.create({ recordType: CoreTasks.User, orderBy: 'name', localOnly: YES })));
      this.usersController.set('content', CoreTasks.get('allUsers'));
    }
    if(!userHash) {
      // FIXTURE-based login
      currentUser = CoreTasks.getUserByLoginName(Tasks.get('loginName'));
    }
    else {
      // Server-based login
      SC.RunLoop.begin();
      CoreTasks.store.loadRecords(CoreTasks.User, [ userHash ]);
      SC.RunLoop.end();
      currentUser = CoreTasks.getUserByLoginName(userHash.loginName);
    }

    // Greet user and save login session information
    CoreTasks.set('currentUser', currentUser);
    CoreTasks.setPermissions();
    var welcomeMessageView = Tasks.getPath('mainPage.welcomeMessageView');
    if(welcomeMessageView) {
      welcomeMessageView.set('toolTip', "_LoginSince".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    }

    // Based on user's role set up appropriate task filter
    if(CoreTasks.getPath('currentUser.role') === CoreTasks.USER_ROLE_DEVELOPER) { // Set assignee selection filter to current user
      Tasks.filterSearchController.setCurrentUserTasksSearch();
    }

    // Setup projects/tasks/watches controllers
    if (!CoreTasks.get('allProjects')) {
      CoreTasks.set('allProjects', CoreTasks.store.find(
        SC.Query.create({ recordType: CoreTasks.Project, orderBy: 'name', localOnly: YES })));
      this.projectsController.set('content', CoreTasks.get('allProjects'));
    }
    if (!CoreTasks.get('allTasks')) {
      CoreTasks.set('allTasks', CoreTasks.store.find( 
        SC.Query.create({ recordType: CoreTasks.Task, localOnly: YES })));
    }
    if (!CoreTasks.get('allWatches')) {
      CoreTasks.set('allWatches', CoreTasks.store.find(
        SC.Query.create({ recordType: CoreTasks.Watch, localOnly: YES })));
    }
    if (!CoreTasks.get('allComments')) {
      CoreTasks.set('allComments', CoreTasks.store.find(
        SC.Query.create({ recordType: CoreTasks.Comment, localOnly: YES })));
    }
    this._selectDefaultProject(false);

    Tasks.statechart.sendEvent('authenticationSucceeded');
    
  },

  /**
   * Called after failed authentication.
   *
   * @param {SC.Response} response object from failed call
   */
  _authenticationFailure: function(response) {
    
    // console.log('DEBUG: _authenticationFailure()');
    
    Tasks.getPath('loginPage.panel').setAuthenticatingMessageVisibility(false);
    
    var errorString = SC.instanceOf(response, SC.Error)? "_LoginServerAccessError".loc() : "_LoginAuthenticationError".loc();
    Tasks.loginController.displayLoginErrorMessage(errorString);
    Tasks.statechart.sendEvent('authenticationFailed');
    
  },
  
  /**
   * Load all Tasks data from the server.
   */
  loadData: function() {
    
    // Indicate data loading start on status bar
    var serverMessageView = Tasks.getPath('mainPage.serverMessageView');
    if(serverMessageView) {
      serverMessageView.set('icon', 'progress-icon');
      serverMessageView.set('value', "_LoadingData".loc());
    }

    // Get the last retrieved information from localStorage (if available).
    var lastRetrieved = Tasks.get('lastRetrieved');
    if(SC.empty(lastRetrieved) && CoreTasks.get('useLocalStorage')) {
      var adapter;
      adapter = this._adapter = SCUDS.LocalStorageAdapterFactory.getAdapter('Tasks');
      lastRetrieved = adapter.get('lastRetrieved');
      // console.log('DEBUG: setting lastRetrieved value from localStorage: ' + lastRetrieved);
      if (!SC.empty(lastRetrieved)) {
        var lastRetrievedAt = parseInt(lastRetrieved, 10);
        var monthAgo = SC.DateTime.create().get('milliseconds') - 30*CoreTasks.MILLISECONDS_IN_DAY;
        if(isNaN(lastRetrievedAt) || lastRetrievedAt < monthAgo) {
          // console.log('DEBUG: resetting lastRetrieved for aged local storage data');
          SCUDS.LocalStorageAdapterFactory.nukeAllAdapters();
          lastRetrieved = null;
        }
      }
    }

    // Branch on the server type (Persevere, GAE, fixtures).
    var params = {
      successCallback: this._loadDataSuccess.bind(this),
      failureCallback: this._loadDataFailure.bind(this)
    };
    var serverType = Tasks.get('serverType');
    if (serverType === Tasks.PERSEVERE_SERVER) {
      // Determine which function to call based on value of lastRetrieved.
      var methodInvocation;
      if (SC.empty(lastRetrieved)) {
        methodInvocation = { method: 'getAll', id: 'records', params: [Tasks.loadDoneProjectData] };
      } else {
        methodInvocation = { method: 'getModified', id: 'records', params: [lastRetrieved] };
      }
      CoreTasks.executeTransientPost('Class/records', methodInvocation, params);
    } else if(serverType === Tasks.GAE_SERVER){
      params.queryParams = { 
        UUID: CoreTasks.getPath('currentUser.id'),
        authToken: CoreTasks.getPath('currentUser.authToken'),
        action: 'getRecords',
        loadDoneProjectData: Tasks.loadDoneProjectData,
        lastRetrievedAt: lastRetrieved || ''
      };
      CoreTasks.executeTransientGet('records', undefined, params);
    } else { // Fixtures mode
      this._loadDataSuccess();
    }

    // Set the last retrieved value in localStorage.
    lastRetrieved = SC.DateTime.create().get('milliseconds') + ''; // now
    if(CoreTasks.get('useLocalStorage')) {
      // console.log('DEBUG: setting lastRetrieved value in localStorage: ' + lastRetrieved);
      this._adapter.save(lastRetrieved, 'lastRetrieved');
    }
    Tasks.set('lastRetrieved', lastRetrieved);

  },
  
  /**
   * Called after data loaded successfully.
   */
  _loadDataSuccess: function(response) {
    // console.log('DEBUG: loadDataSuccess()');
 
    if(response) { // Has a Server, not Fixtures mode
      // Process/load records into store
      var typeMap = {
        "users":     CoreTasks.User,
        "tasks":     CoreTasks.Task,
        "projects":  CoreTasks.Project,
        "watches":   CoreTasks.Watch,
        "comments":   CoreTasks.Comment
      };
      var recordSets = response.result;
      SC.RunLoop.begin();
      for(var recordSet in recordSets) {
        var recordType = typeMap[recordSet];
        if(SC.typeOf(recordType) === SC.T_CLASS) {
          var records = recordSets[recordSet];
          // console.log('DEBUG: loading ' + records.length + ' ' + recordSet);
          CoreTasks.store.loadRecords(recordType, records);
          if(CoreTasks.get('useLocalStorage')) {
            var recordTypeStr = SC.browser.msie ? recordType._object_className : recordType.toString();
            var adapter = SCUDS.LocalStorageAdapterFactory.getAdapter(recordTypeStr);
            adapter.save(records);
          }
        }
      }
      SC.RunLoop.end();
    }
    if(Tasks.get('loginTime')) {
      Tasks.set('loginTime', false);
      if(this.get('defaultProjectId')) this._selectDefaultProject(true);
      this.set('defaultProjectId', null);
    }
 
    // Indicate data loading completion on status bar
    var serverMessageView = Tasks.getPath('mainPage.serverMessageView');
    if(serverMessageView) {
      serverMessageView.set('icon', '');
      serverMessageView.set('value', "_DataLoaded".loc() + SC.DateTime.create(parseInt(Tasks.get('lastRetrieved'), 10)).toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    }
    Tasks.projectsController.refreshCountdowns();

  },
  
  /**
   * Called after failed data load.
   */
  _loadDataFailure: function(response) {
    var serverMessageView = Tasks.getPath('mainPage.serverMessageView');
    serverMessageView.set('icon', '');
    serverMessageView.set('value', "_DataLoadFailed".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
  },
  
  /**
   * Select default project if one is specified via a Route
   */
  _selectDefaultProject: function(warnIfMissing) {
    var defaultProject = CoreTasks.get('allTasksProject');
    var defaultProjectId = this.get('defaultProjectId');
    // console.log('DEBUG: selectDefaultProject() warnIfMissing=' + warnIfMissing + ', defaultProjectId=' + defaultProjectId);
    if(defaultProjectId) { // if specified via a Route
      var project = CoreTasks.getProjectById(defaultProjectId); // see if such a project exists
      if(project) {
        defaultProject = project;
      }
      else if(warnIfMissing) {
        console.warn('selectDefaultProject(): No project of ID #' + defaultProjectId);
      }
    }
    this.set('defaultProject', defaultProject);
    this.projectsController.selectObject(defaultProject);
  },
  
  /**
   * Save modified Tasks data to server.
   */
  saveChanges: function() {
    if(CoreTasks.get('needsSave')) {
      var serverMessageView = Tasks.getPath('mainPage.serverMessageView');
      CoreTasks.saveChanges();
      serverMessageView.set('value', "_DataSaved".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    }
  }
  
});

