/**
 * A mixin that defines all of the "actions" that trigger state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks sc_require */

sc_require('core');
sc_require('controllers/users');
sc_require('controllers/tasks');
sc_require('controllers/projects');

Tasks.mixin({

  loginName: null,

  /**
   * Authenticate user trying to log in to Tasks application.
   *
   * @param {String} user's login name.
   * @param {String} user's password.
   */
  authenticate: function(loginName, password) {
    // console.log('DEBUG: authenticate()');
    switch (this.state.a) {
      case 1:
        this.goState('a', 2);
        Tasks.set('loginName', loginName);
        if(CoreTasks.remoteDataSource) { // remote authentication
          var params = {
            successCallback: this.authenticationSuccess.bind(this),
            failureCallback: this.authenticationFailure.bind(this)
          };
          return CoreTasks.User.authenticate(loginName, password, params);
        }
        else { // running off fixtures
          for(var i = 0, len = CoreTasks.User.FIXTURES.length; i < len; i++) {
            if(loginName === CoreTasks.User.FIXTURES[i].loginName) {
              return this.authenticationSuccess();
            }
          }
          return this.authenticationFailure();
        }
        break;

      default:
        this._logActionNotHandled('authenticate', 'a', this.state.a);  
    }
  },
  
  /**
   * Called after successful authentication.
   */
  authenticationSuccess: function(response, request) {
    // console.log('DEBUG: authenticationSuccess()');
    switch (this.state.a) {
      case 1:
      case 2:
        Tasks.loginController.closePanel();
        Tasks.getPath('mainPage.mainPane').append();
        Tasks.mainPageHelper.set('clippyDetails', document.getElementById(Tasks.mainPageHelper.clippyDetailsId));
        var headers = request.get('headers');
        if(SC.typeOf(headers) === SC.T_HASH) {
          var server = headers.Server;
          if(server && server.indexOf('Persevere') !== -1) Tasks.set('serverType', Tasks.PERSEVERE_SERVER);
        }
        this.goState('a', 3);
        break;

      default:
        this._logActionNotHandled('authenticationSuccess', 'a', this.state.a);  
    }
  },

  /**
   * Called after failed authentication.
   *
   * @param {SC.Response} response object from failed call
   */
  authenticationFailure: function(response) {
    // console.log('DEBUG: authenticationFailure()');
    switch (this.state.a) {
      case 2:
        var errorString = SC.instanceOf(response, SC.Error)? "_LoginServerAccessError".loc() : "_LoginAuthenticationError".loc();
        Tasks.loginController.displayLoginError(errorString);
        this.goState('a', 1);
        break;
      default:
        this._logActionNotHandled('authenticationFailure', 'a', this.state.a);  
    }
  },
  
  /**
   * Load all Tasks data from the server.
   */
  loadData: function() {
    
    // console.log('DEBUG: loadData()');
    // Indicate data loading start on status bar
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('icon', 'progress-icon');
    serverMessage.set('value', "_LoadingData".loc());
    
    var params = {
      successCallback: this._loadDataSuccess.bind(this),
      failureCallback: this._loadDataFailure.bind(this)
    };
    if(Tasks.get('serverType') === Tasks.PERSEVERE_SERVER) {
      var methodInvocation = {
        method: 'get',
        id: 'records',
        params: []
      };
      CoreTasks.executeTransientPost('Class/all', methodInvocation, params);
    }
    else {
      CoreTasks.executeTransientGet('records', undefined, params);
    }
  },
  
  /**
   * Called after data loaded successfully.
   */
  _loadDataSuccess: function(response) {
    // console.log('DEBUG: loadDataSuccess()');
    
    // Process/load records into store
    var typeMap = {
      "users":     CoreTasks.User,
      "tasks":     CoreTasks.Task,
      "projects":  CoreTasks.Project,
      "watches":   CoreTasks.Watch
    };
    var recordSets = response.result;
    for(var recordSet in recordSets) {
      var recordType = typeMap[recordSet];
      if(SC.typeOf(recordType) === SC.T_CLASS) {
        var records = recordSets[recordSet];
        CoreTasks.store.loadRecords(recordType, records);
        CoreTasks.store.purgeDeletedRecords(recordType, records);
      }
    }
    
    // Setup data controllers
    if (!CoreTasks.get('allUsers')) {
      CoreTasks.set('allUsers', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.User, orderBy: 'name', initialServerFetch: NO })));
      this.usersController.set('content', CoreTasks.get('allUsers'));
    }
    if (!CoreTasks.get('allTasks')) {
      CoreTasks.set('allTasks', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Task, initialServerFetch: NO })));
    }
    if (!CoreTasks.get('allProjects')) {
      CoreTasks.set('allProjects', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Project, initialServerFetch: NO })));
      this.projectsController.set('content', CoreTasks.get('allProjects'));
    }
    if(CoreTasks.get('canServerSendNotifications') && !CoreTasks.get('allWatches')) {
      CoreTasks.set('allWatches', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Watch, initialServerFetch: NO })));
    }
    
    // Set the current logged on user
    var currentUser = CoreTasks.getUser(this.loginName);
    if (currentUser) {
      
      if(CoreTasks.loginTime) {
        
        // Greet user and save login session information
        CoreTasks.set('currentUser', currentUser);
        CoreTasks.setPermissions();
        var welcomeMessage = Tasks.getPath('mainPage.mainPane.welcomeMessage');
        welcomeMessage.set('toolTip', "_LoginSince".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
        
        // Based on user's role set up appropriate task filter
        var role = currentUser.get('role');
        if(role === CoreTasks.USER_ROLE_DEVELOPER) { // Set assignee selection filter to current user
          Tasks.showCurrentUserTasks();
        }
        
      }
    }
    else {
      SC.AlertPane.error ('System Error', 'Logged in user no longer exists!');
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
    
    // Select default project if one is specified
    if(CoreTasks.loginTime) {
      var defaultProject = CoreTasks.get('allTasksProject');
      var defaultProjectName = this.get('defaultProjectName');
      if(defaultProjectName) { // if specified via a Route
        var project = CoreTasks.getProject(defaultProjectName); // see if such a project exists
        if(project) defaultProject = project;
      }
      this.set('defaultProject', defaultProject);
      this.projectsController.selectObject(defaultProject);
      CoreTasks.loginTime = false;
    }
    
    // Indicate data loading completion on status bar
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('icon', '');
    serverMessage.set('value', "_DataLoaded".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    Tasks.projectsController.refreshCountdowns();
    this.goState('a', 4);

  },
  
  /**
   * Called after failed data load.
   */
  _loadDataFailure: function(response) {
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('icon', '');
    serverMessage.set('value', "_DataLoadFailed".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    switch (this.state.a) {
      case 3:
        if(!CoreTasks.loginTime) this.goState('a', 4);
        break;
      default:
        this._logActionNotHandled('dataLoadFailure', 'a', this.state.a);  
    }
  },
  
  /**
   * Set filter to show current user's tasks.
   */
  showCurrentUserTasks: function() {
    Tasks.assignmentsController.setAssigneeFilter(this.loginName);
  },
  
  
  /**
   * Save modified Tasks data to server.
   */
  saveData: function() {
    if(CoreTasks.get('needsSave')) {
      var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
      CoreTasks.saveChanges();
      serverMessage.set('value', "_DataSaved".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
    }
  },
  
  /**
   * Called by CoreTasks when data saves fail.
   *
   * @param (String) type of record for which save failed
   */
  dataSaveErrorCallback: function(errorRecordType) {
    // console.log('DEBUG: dataSaveErrorCallback(' + errorRecordType + ')');
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', "_DataSaveError".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT));
  },

  /**
   * Reload latest Tasks data from server.
   */
  refreshData: function() {
    this.goState('a', 3);
  },
  
  /**
   * Import data from external text file.
   */
  importData: function() {
    Tasks.importDataController.openPanel();  
  },

  /**
   * Launch Settings panel for user/preference management.
   */
   /**
    * Launch task editor dialog.
    */
  settings: function() {
   Tasks.settingsController.openPanel();
  },

  /**
   * Display online help.
   */
   /**
    * Launch task editor dialog.
    */
  help: function() {
    var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '#help';
    window.open(url, '', 'width=1000,height=750,menubar=no,location=no,toolbar=no,directories=no,status=no');
  },
  
  /**
   * Handle application exiting request.
   */
  logout: function() {
    SC.AlertPane.warn("_Confirmation".loc(), "_LogoutConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
      SC.Object.create({
        alertPaneDidDismiss: function(pane, status) {
          if(status === SC.BUTTON1_STATUS) {
            Tasks._exit();
          }
        }
      })
    );
  },
  
  /**
   * See if there are any changes before exiting application.
   */
  _exit: function() {
    if(CoreTasks.get('needsSave')) {
      SC.AlertPane.warn("_Confirmation".loc(), "_SaveConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON1_STATUS) {
              Tasks.saveAndExit();
            }
            else if(status === SC.BUTTON2_STATUS){
              Tasks.exitNoSave();
            }
          }
        })
      );
    }
    else {
      this.exitNoSave();
    }
  },
  
  /**
   * Save all changes before exiting application.
   */
  saveAndExit: function() {
    CoreTasks.saveChanges();
    this.restart();
  },
  
  /**
   * Exit application without saving changes.
   */
  exitNoSave: function() {
    this.restart();
  },
  
  /**
   * Restart application - invoked at logout and for a route to a new project.
   */
  restart: function() {
    
    Tasks.setPath('mainPage.mainPane.welcomeMessage.value', null);
    CoreTasks.set('currentUser', null);
    CoreTasks.loginTime = true;
    
    this.get('assignmentsController').resetFilters();
    this.usersController.set('content', null);
    this.projectsController.set('content', null);
    this.projectsController.set('selection', null);
    CoreTasks.clearData();
    
    this.goState('a', 1);
    Tasks.loginController.openPanel();
    
  },
  
  /**
   * Add a new project in projects master list.
   */
  addProject: function() {
    this._createProject(false);
  },
  
  /**
   * Duplicate selected project in projects master list.
   *
   * @param {Boolean} flag to indicate whether to make a duplicate of selected project.
   */
  duplicateProject: function() {
    this._createProject(true);
  },
  
  /**
   * Create a new project in projects master list and start editing it .
   *
   * @param {Boolean} flag to indicate whether to make a duplicate of selected task.
   */
  _createProject: function(duplicate) {
    
    if(!CoreTasks.getPath('permissions.canCreateProject')) {
      console.warn('You do not have permission to add or duplicate a project');
      return null;
    }
    
    var projectHash = SC.clone(CoreTasks.Project.NEW_PROJECT_HASH);
    projectHash.name = projectHash.name.loc();
    if(duplicate) {
      var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
      if (!selectedProject) {
        console.warn('You must have a project selected to duplicate it');
        return null;
      }
      projectHash.name = selectedProject.get('name') + "_Copy".loc();
      projectHash.description = selectedProject.get('description');
      projectHash.timeLeft = selectedProject.get('timeLeft');
      projectHash.developmentStatus = selectedProject.get('developmentStatus');
    }
    
    // Create, select, and begin editing new project.
    var project = CoreTasks.createRecord(CoreTasks.Project, projectHash);
    var pc = this.projectsController;
    pc.selectObject(project);
    CoreTasks.invokeLater(pc.editNewProject, 200, project);
    return project;
  },
  
  /**
  * Delete selected tasks, asking for confirmation first.
   */
  deleteProject: function() {
    
    if(!CoreTasks.getPath('permissions.canDeleteProject')) {
      console.warn('You do not have permission to delete a project');
      return;
    }
    
    var sel = Tasks.projectsController.get('selection');
    var len = sel? sel.length() : 0;
    if (len > 0) {

      // Confirm deletion operation
      SC.AlertPane.warn("_Confirmation".loc(), "_ProjectDeletionConfirmation".loc(), "_TasksUnallocated".loc(), "_Yes".loc(), "_No".loc(), null,
      SC.Object.create({
        alertPaneDidDismiss: function(pane, status) {
          if(status === SC.BUTTON1_STATUS) {
            var context = {};
            for (var i = 0; i < len; i++) {
              // Get and delete each selected (non-system) project.
              var project = sel.nextObject(i, null, context);
              if (CoreTasks.isSystemProject(project)) {
                console.warn('You cannot delete a system project');
              }
              else {
                // Reset default project if it is deleted
                if(project === Tasks.get('defaultProject')) Tasks.set('defaultProject', CoreTasks.get('allTasksProject'));
                project.destroy();
              }
            }
            // Select the default project
            Tasks.projectsController.selectObject(Tasks.get('defaultProject'));
            if(CoreTasks.get('autoSave')) Tasks.saveData();
          }
        }
        })
      );

    }
  },

  /**
   * Popup Project Statistics panel.
   */
  viewStatistics: function() {
    Tasks.assignmentsController.showStatistics();  
  },
  
  /**
   * Add a new task in tasks detail list.
   *
   * @param {Boolean} flag to indicate whether to make a duplicate of selected task.
   */
  addTask: function() {
    this._createTask(false);
  },
  
  /**
   * Duplicate selected task in tasks detail list.
   *
   * @param {Boolean} flag to indicate whether to make a duplicate of selected task.
   */
  duplicateTask: function() {
    this._createTask(true);
  },
  
  /**
   * Delete selected task in tasks detail list.
   */
  /**
   * Create a new task in tasks detail list and start editing it.
   *
   * @param {Boolean} flag to indicate whether to make a duplicate of selected task.
   */
  _createTask: function(duplicate) {
    
    if(!Tasks.tasksController.isAddable()) {
      console.warn('This is the wrong display mode or you do not have permission to add or duplicate a task');
      return null;
    }
    
    // Create a new task with the logged in user as the default submitter/assignee within selected project, if one.
    var userId = CoreTasks.getPath('currentUser.id');
    var taskHash = SC.merge({ 'submitterId': userId }, SC.clone(CoreTasks.Task.NEW_TASK_HASH));
    taskHash.name = taskHash.name.loc();
    if(Tasks.getPath('projectsController.selection.firstObject') !== CoreTasks.get('unassignedTasksProject') &&
       CoreTasks.getPath('currentUser.role') !== CoreTasks.USER_ROLE_GUEST) {
         taskHash.assigneeId = userId;
    }
    var sel = Tasks.projectsController.getPath('selection');
    var project = (sel && sel.get('length' === 1))? sel.get('firstObject') : null;
    if (project && CoreTasks.isSystemProject(project)) {
      taskHash.projectId = project.get('id');
    }
    
    // Get selected task (if one) and copy its project/assignee/type/priority to the new task.
    var tc = this.get('tasksController');
    sel = tc.get('selection');
    if (sel && sel.length() > 0) {
      var selectedTask = sel.firstObject();
      if (SC.instanceOf(selectedTask, CoreTasks.Task)) {
        taskHash.projectId = selectedTask.get('projectId');
        var assigneeUser = selectedTask.get('assignee');
        taskHash.assigneeId = (assigneeUser && assigneeUser.get('role') !== CoreTasks.USER_ROLE_GUEST)? assigneeUser.get('id') : null;
        taskHash.type = selectedTask.get('type');
        taskHash.priority = selectedTask.get('priority');
        if(duplicate) {
          taskHash.name = selectedTask.get('name') + "_Copy".loc();
          taskHash.effort = selectedTask.get('effort');
          taskHash.description = selectedTask.get('description');
          taskHash.developmentStatus = selectedTask.get('developmentStatus');
          taskHash.validation = selectedTask.get('validation');
        }
      }
    }
    else { // No selected task, add task to currently selected, non-system, project (if one).
      if(duplicate) {
        console.warn('You must have a task selected to duplicate it');
        return null;
      }
      var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
      if (!CoreTasks.isSystemProject(selectedProject)) {
        taskHash.projectId = Tasks.getPath('projectController.id');
      }
    }
    
    // Create, select, and begin editing new task.
    var task = CoreTasks.createRecord(CoreTasks.Task, taskHash);
    tc.selectObject(task);
    CoreTasks.invokeLater(tc.editNewTask, 200, task);
    return task;
        
  },

  /**
   * Delete selected tasks, asking for confirmation first.
   */
  deleteTask: function() {
    
    if(!Tasks.tasksController.isDeletable()) {
      console.warn('This is the wrong display mode or you do not have permission to delete a task');
      return;
    }
    
    var ac = this.get('assignmentsController');      
    var tc = this.get('tasksController');
    var sel = tc.get('selection');
    var len = sel? sel.length() : 0;
    if (len > 0) {

      // Confirm deletion operation
      SC.AlertPane.warn("_Confirmation".loc(), "_TaskDeletionConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
      SC.Object.create({
        alertPaneDidDismiss: function(pane, status) {
          if(status === SC.BUTTON1_STATUS) {
            var context = {};
            for (var i = 0; i < len; i++) {
              // Get and delete each selected task.
              var task = sel.nextObject(i, null, context);
              task.destroy();
            }
            Tasks.deselectTasks();
            if(CoreTasks.get('autoSave')) Tasks.saveData();
          }
        }
        })
      );

    }
  },
  
  /**
   * Watch selected tasks (if they are not already being watched).
   */
  watchTask: function() {
    var tc = this.get('tasksController');
    var sel = tc.get('selection');
    var len = sel? sel.length() : 0;
    if (len > 0) {
      var currentUserId = CoreTasks.getPath('currentUser.id');
      var context = {};
      for (var i = 0; i < len; i++) {
        // Get and watch each selected task.
        var task = sel.nextObject(i, null, context);
        if(!CoreTasks.isCurrentUserWatchingTask(task)) {
          var watch = CoreTasks.createRecord(CoreTasks.Watch, { taskId: task.get('id'), userId: currentUserId });
        }
        
      }
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
  },
  
  /**
   * Unwatch selected tasks (if they are being watched).
   */
  unwatchTask: function() {
    var tc = this.get('tasksController');
    var sel = tc.get('selection');
    var len = sel? sel.length() : 0;
    if (len > 0) {
      var context = {};
      for (var i = 0; i < len; i++) {
        // Get and unwatch each selected task.
        var task = sel.nextObject(i, null, context);
        var watch = CoreTasks.getCurrentUserTaskWatch(task);
        if(watch) watch.destroy();
      }
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
  },
  
  /**
   * Filter tasks via attributes.
   */
  filterTasks: function() {
    Tasks.filterController.openPane();
  },

  /**
   * Add a new user.
   */
  addUser: function() {

    if(!CoreTasks.getPath('permissions.canCreateUser')) {
      console.warn('You do not have permission to add a user');
      return null;
    }
    
    // Create and select new user (copy role of selected user if one).
    var userHash = SC.clone(CoreTasks.User.NEW_USER_HASH);
    var selectedUser = Tasks.usersController.getPath('selection.firstObject');
    if (selectedUser) userHash.role = selectedUser.get('role');
    var user = CoreTasks.createRecord(CoreTasks.User, userHash);
    Tasks.usersController.selectObject(user);
    Tasks.settingsPage.get('userInformation').get('fullNameField').becomeFirstResponder();
    if(CoreTasks.get('autoSave')) Tasks.saveData();
    return user;
    
  },

  /**
   * Delete selected user.
   */
  deleteUser: function() {
  
    if(!CoreTasks.getPath('permissions.canDeleteUser')) {
      console.warn('You do not have permission to delete a user');
      return;
    }
    
    var uc = this.get('usersController');      
    var sel = uc.get('selection');
    var len = sel? sel.length() : 0;
    if (len > 0) {
      
      // Confirm deletion operation
      SC.AlertPane.warn("_Confirmation".loc(), "_UserDeletionConfirmation".loc(), "_TasksUnassigned".loc(), "_Yes".loc(), "_No".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON1_STATUS) {
              var context = {};
              for (var i = 0; i < len; i++) {
                // Get and delete each selected user.
                var user = sel.nextObject(i, null, context);
                user.destroy();
              }
              // Select the logged in user.
              Tasks.usersController.selectObject(CoreTasks.get('currentUser'));
              if(CoreTasks.get('autoSave')) Tasks.saveData();
            }
          }
        })
      );

    }
  },
  
  /**
    If the user indicated that they needed to sign up for a new account
    then launch the signup pane.
  */
  launchSignupPane: function(){
    Tasks.SIGNUP.didBecomeFirstResponder();
  },

  /**
    Manipulate auto save option.
  */
  toggleAutoSave: function(){
    CoreTasks.set('autoSave', !CoreTasks.get('autoSave'));
  },

  /**
    Manipulate email notifications option.
  */
  toggleShouldNotify: function(){
    CoreTasks.set('shouldNotify', !CoreTasks.get('shouldNotify'));
  },

  /**
   * Logs a message indicating that the given state isn't handled in the given action.
   *
   * @param {String} action The name of the action (ex. "logout").
   * @param {String} stateName The name of the state (ex. "a").
   * @param {Integer} stateNum The number of the sate (ex. "4").
   */
  _logActionNotHandled: function(action, stateName, stateNum) {
    console.error('Action not handled in state %@[%@]: %@'.fmt(stateName, stateNum, action));
  },
  
  /**
   * Temporary callback to handle missing functionality.
   *
   * @param (String) message to show user
   */
  _notImplemented: function(message) {
    var prefix = '';
    if(message) {
      prefix = message;
    }
    SC.AlertPane.warn ('Unimplemented Functionality', prefix + ' coming soon!');
  }
    
});

