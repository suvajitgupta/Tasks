/**
 * A mixin that defines all of the "actions" that trigger state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit GÏupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks sc_require */
// TODO: [SG] Beta: handle backspace to not go back to previous Web page and leave the Tasks app!

sc_require('core');
sc_require('controllers/users');
sc_require('controllers/tasks');
sc_require('controllers/projects');

Tasks.mixin({

  _loginTime: true, // to indicate when there is a login sequence in progress
  loginName: null,

  /**
   * Authenticate user trying to log in to Tasks application.
   *
   * @param {String} user's login name.
   * @param {String} user's password.
   */
  authenticate: function(loginName, password) {
    // console.log("DEBUG: authenticate()");
    switch (this.state.a) {
      case 1:
        this.goState('a', 2);
        Tasks.set('loginName', loginName);
        var params = {
          successCallback: this.authenticationSuccess.bind(this),
          failureCallback: this.authenticationFailure.bind(this)
        };
        // perservere authentication
        CoreTasks.User.authenticate(loginName, "", params);
        // sinatra authentication
        // TODO [JH2, SG]  We need a way to determine the backend
        // This has been tested and it works! :)
        // CoreTasks.User.sinatraAuthenticate(loginName,"",params);
        break;

      default:
        this._logActionNotHandled('authenticate', 'a', this.state.a);  
    }
  },
  
  /**
   * Called after successful authentication.
   */
  authenticationSuccess: function() {
    // console.log("DEBUG: authenticationSuccess()");
    switch (this.state.a) {
      case 1:
      case 2:
        Tasks.loginController.closePanel();
        Tasks.getPath('mainPage.mainPane').append();
        this.goState('a', 3);
        break;

      default:
        this._logActionNotHandled('authenticationSuccess', 'a', this.state.a);  
    }
  },

  /**
   * Called after failed authentication.
   */
  authenticationFailure: function() {
    // console.log("DEBUG: authenticationFailure()");
    switch (this.state.a) {
      case 2:
        Tasks.loginController.displayLoginError();
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
    // console.log("DEBUG: loadData()");
    // Start by loading all users.
    if (!CoreTasks.get('allUsers')) {
      CoreTasks.set('allUsers', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.User, orderBy: 'name' })));
      this.usersController.set('content', CoreTasks.get('allUsers'));
    } else {
      CoreTasks.get('allUsers').refresh();
    }

  },
  
  /**
   * Called after all users have been successfully loaded from the server.
   */
  usersLoadSuccess: function() {
    // console.log("DEBUG: usersLoadSuccess()");
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', "_UsersLoaded".loc());
    
    // Set the current logged on user
    var currentUser = CoreTasks.getUser(this.loginName);
    if (currentUser) {
      
      if(this._loginTime) {
        
        // Greet user and save login session information
        CoreTasks.set('currentUser', currentUser);
        CoreTasks.setPermissions();
        
        var welcomeMessage = Tasks.getPath('mainPage.mainPane.welcomeMessage');
        welcomeMessage.set('value', "_User:".loc() + '<b>' + CoreTasks.getPath('currentUser.name') + '</b>, ' +
                           "_Role:".loc() + ' <i>' + CoreTasks.getPath('currentUser.role').loc() + '</i>');
        welcomeMessage.set('toolTip', "_LoginSince".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy'));
        
        // Based on user's role set up appropriate task filter
        var role = currentUser.get('role');
        
        // Set "Team" display mode for Managers
        Tasks.assignmentsController.set('displayMode',
          role === CoreTasks.USER_ROLE_MANAGER? Tasks.DISPLAY_MODE_TEAM : Tasks.DISPLAY_MODE_TASKS);
        
        if(role === CoreTasks.USER_ROLE_DEVELOPER) { // Set assignee selection filter to current user
          Tasks.assignmentsController.set('assigneeSelection', this.loginName);
        }
        else if(role === CoreTasks.USER_ROLE_TESTER) { // Filter out Other tasks
          Tasks.assignmentsController.attributeFilter(CoreTasks.TASK_TYPE_OTHER, 0);
        }
        
      }
    }
    else {
      SC.AlertPane.error ('System Error', 'Logged in user no longer exists!');
    }
      
    // Now load all of the tasks.
    if (!CoreTasks.get('allTasks')) {
      CoreTasks.set('allTasks', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Task })));
      this.allTasksController.set('content', CoreTasks.get('allTasks'));
    } else {
      CoreTasks.get('allTasks').refresh();
    }
    
  },

  /**
   * Called after all tasks have been loaded from the server.
   */
  tasksLoadSuccess: function() {
    // console.log("DEBUG: tasksLoadSuccess()");
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', serverMessage.get('value') + "_TasksLoaded".loc());

    // Create the AllTasks project to hold all tasks.
    if(!CoreTasks.get('allTasksProject')) {
      var allTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.ALL_TASKS_NAME.loc()
      });
      CoreTasks.set('allTasksProject', allTasksProject);
    }

    // Create the UnallocatedTasks project with the unallocated tasks.
    if(!CoreTasks.get('unallocatedTasksProject')) {
      var unallocatedTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.UNALLOCATED_TASKS_NAME.loc()
      });
      CoreTasks.set('unallocatedTasksProject', unallocatedTasksProject);
    }
    
    // Now load all of the projects.
    if (!CoreTasks.get('allProjects')) {
      CoreTasks.set('allProjects', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Project, orderBy: 'name' })));
      this.projectsController.set('content', CoreTasks.get('allProjects'));
    } else {
      CoreTasks.get('allProjects').refresh();
    }
    
  },

  /**
   * Called after all projects have been loaded from the server.
   */
  projectsLoadSuccess: function() {

    // console.log("DEBUG: projectsLoadSuccess()");
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', serverMessage.get('value') + "_ProjectsLoaded".loc() + new Date().format('hh:mm:ss a'));

    if(this._loginTime) {
      var defaultProject = CoreTasks.get('allTasksProject');
      var defaultProjectName = this.get('defaultProjectName');
      if(defaultProjectName) { // if specified via a Route
        var project = CoreTasks.getProject(defaultProjectName); // see if such a project exists
        if(project) defaultProject = project;
      }
      this.set('defaultProject', defaultProject);
      this.projectsController.selectObject(defaultProject);
    }
    
    this.dataLoadSuccess();
  },

  /**
   * Called after successful data load.
   */
  dataLoadSuccess: function() {
    // console.log("DEBUG: dataLoadSuccess()");
    switch (this.state.a) {
      case 3:
        if(this._loginTime) {
          this._loginTime = false;
        }
        this.goState('a', 4);
        break;
      default:
        this._logActionNotHandled('dataLoadSuccess', 'a', this.state.a);  
    }
  },
  
  /**
   * Called after failed data load.
   */
  dataLoadFailure: function() {
    // console.log("DEBUG: dataLoadFailure()");
    switch (this.state.a) {
      case 3:
        SC.AlertPane.error ('System Error', 'Unable to retrieve Tasks data from server');
        break;
      default:
        this._logActionNotHandled('dataLoadFailure', 'a', this.state.a);  
    }
  },
  
  /**
   * Save modified Tasks data to server.
   */
  saveData: function() {
    CoreTasks.saveChanges();
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', "_SaveMessage".loc() + new Date().format('hh:mm:ss a'));
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
   * Export data to external text file.
   */
  exportData: function() {
    Tasks.exportDataController.openPanel();  
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
    SC.AlertPane.warn("_Confirmation".loc(), "_LogoutConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
      SC.Object.create({
        alertPaneDidDismiss: function(pane, status) {
          if(status === SC.BUTTON2_STATUS) Tasks.restart();
        }
      })
    );
  },
  
  /**
   * Restart application - invoked at logout and for a route to a new project.
   */
  restart: function() {
    
    Tasks.getPath('mainPage.mainPane.welcomeMessage').set('value', null);
    CoreTasks.set('currentUser', null);
    this._loginTime = true;
    
    // TODO [JH2,SG] We need to determine what backend we are using
    // before we can use this, but it works.
    // var params = {
    //   successCallback: function() { console.log('successful logout'); }.bind(this),
    //   failureCallback: function() { console.log('Failed logout'); }.bind(this)
    // };
    // CoreTasks.User.logout('logout', params);
    
    this.get('assignmentsController').resetFilters();
    this.usersController.set('content', null);
    this.allTasksController.set('content', null);
    this.projectsController.set('content', null);
    CoreTasks.clearData();
    
    this.goState('a', 1);
    
  },
  
  /**
   * Save all changes before exiting application.
   */
  saveAndExit: function() {
    // TODO: [SG] Beta: implement save & exit
    this._notImplemented('saveAndExit');
  },
  
  /**
   * Exit application without saving changes.
   */
  exitNoSave: function() {
    // TODO: [SG] Beta: implement exit w/o save
    this._notImplemented('exitNoSave');
  },
  
  /**
   * Add a new project and start editing it in projects master list.
   */
  addProject: function() {
    
    if(!CoreTasks.getPath('permissions.canAddProject')) {
      console.log('Error: you do not have permission to add a project');
      return null;
    }
    
    // Create, select, and begin editing new project.
    var project = CoreTasks.createRecord(CoreTasks.Project, { name: CoreTasks.NEW_PROJECT_NAME.loc() } );
    var pc = this.projectsController;
    pc.selectObject(project);
    // FIXME: [SG] may need to expand the delay interval for launching inline editors on IE
    CoreTasks.invokeLater(pc.editNewProject, 200, project);
    return project;
  },
  
  /**
   * Delete selected project in master projects list, asking for confirmation if project has tasks.
   */
  deleteProject: function() {
    
    if(!CoreTasks.getPath('permissions.canDeleteProject')) {
      console.log('Error: you do not have permission to delete a project');
      return;
    }
    
    // Get the selected project, if one
    var project = Tasks.projectsController.getPath('selection.firstObject');
    if (project) {

      // Disallow deletion of reserved projects
      var projectName = project.get('name');
      if (projectName === CoreTasks.ALL_TASKS_NAME.loc() || projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return;
      
      // Confirm deletion for projects that have tasks
      var tasks = project.get('tasks');
      var taskCount = tasks.get('length');
      if(taskCount > 0) {
        SC.AlertPane.warn("_Confirmation".loc(), "_ProjectDeletionConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
          SC.Object.create({
            alertPaneDidDismiss: function(pane, status) {
              if(status === SC.BUTTON2_STATUS) Tasks._deleteProject(project);
            }
          })
        );
      }
      else {
        Tasks._deleteProject(project);
      }
    }
  },
  
  /**
   * Delete project without user confirmation.
   */
  _deleteProject: function(project) {
    // Reset default project if it is deleted
    if(project === Tasks.get('defaultProject')) Tasks.set('defaultProject', CoreTasks.get('allTasksProject'));

    // Delete the project
    project.destroy();

    // Select the default project
    Tasks.projectsController.selectObject(Tasks.get('defaultProject'));
  },
  
  /**
   * Add a new task to tasks detail list.
   */
  addTask: function() {
    
    if(!CoreTasks.getPath('permissions.canAddTask')) {
      console.log('Error: you do not have permission to add a task');
      return null;
    }
    
    // Create a new task with the logged in user as the default submitter/assignee within selected project, if one.
    var userId = CoreTasks.getPath('currentUser.id');
    var taskHash = SC.merge({ 'submitterId': userId, 'assigneeId': userId }, SC.clone(CoreTasks.Task.NEW_TASK_HASH));
    taskHash.name = taskHash.name.loc();
    var project = Tasks.projectsController.getPath('selection.firstObject');
    if (project && project !== CoreTasks.get('allTasksProject') && project !== CoreTasks.get('unallocatedTasksProject')) {
      taskHash.projectId = project.get('id');
    }
    
    // Get selected task (if one) and copy its project/assignee/type/priority to the new task.
    var tc = this.get('tasksController');
    var sel = tc.get('selection');
    if (sel && sel.length() > 0) {
      var selectedTask = sel.firstObject();
      if (SC.instanceOf(selectedTask, CoreTasks.Task)) {
        taskHash.projectId = selectedTask.get('projectId');
        var assigneeUser = selectedTask.get('assignee');
        taskHash.assigneeId = assigneeUser? assigneeUser.get('id') : null;
        taskHash.type = selectedTask.get('type');
        taskHash.priority = selectedTask.get('priority');
      }
    }
    else { // No selected task, add task to currently selected, non-reserved, project (if one).
      var selectedProjectName = Tasks.getPath('projectController.name');
      if (!SC.none(selectedProjectName) &&
          selectedProjectName !== CoreTasks.ALL_TASKS_NAME.loc() && selectedProjectName !== CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
        taskHash.projectId = Tasks.getPath('projectController.id');
      }
    }
    
    // Create, select, and begin editing new task.
    var task = CoreTasks.createRecord(CoreTasks.Task, taskHash);
    Tasks.tasksController.selectObject(task);
    var ac = this.get('assignmentsController');  
    CoreTasks.invokeLater(ac.showAssignments.bind(ac));
    CoreTasks.invokeLater(tc.editNewTask, 200, task);
    return task;
        
  },

  /**
   * Delete selected task in tasks detail list.
   */
  deleteTask: function() {
    
    if(!CoreTasks.getPath('permissions.canDeleteTask')) {
      console.log('Error: you do not have permission to delete a task');
      return;
    }
    
    var ac = this.get('assignmentsController');      
    var tc = this.get('tasksController');
    var sel = tc.get('selection');
    if (sel && sel.length() > 0) {
      var context = {};
      for (var i = 0; i < sel.length(); i++) {
        // Get and delete each selected task.
        var task = sel.nextObject(i, null, context);
        task.destroy();
      }
      Tasks.deselectTasks();
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
  // FIXME: [SG/SE] Beta: see why after adding a user and doing a Save, all tasks show up assigned to this new user
  addUser: function() {

    if(!CoreTasks.getPath('permissions.canAddUser')) {
      console.log('Error: you do not have permission to add a user');
      return null;
    }
    
    // Create and select new user.
    var user = CoreTasks.createRecord(CoreTasks.User, SC.clone(CoreTasks.User.NEW_USER_HASH));
    Tasks.usersController.selectObject(user);
    return user;
    
  },

  /**
   * Delete selected user.
   */
  // FIXME: [SG/SE] Beta: after add a new user, press Save, then login again and delete this user - Save fails this time
  deleteUser: function() {
  
    if(!CoreTasks.getPath('permissions.canDeleteUser')) {
      console.log('Error: you do not have permission to delete a user');
      return;
    }
    
    // Get the selected user.
    var user = Tasks.usersController.getPath('selection.firstObject');
    if (user) {

      // Confirm deletion of user
      SC.AlertPane.warn("_Confirmation".loc(), "_UserDeletionConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON2_STATUS) {
              // Delete the user.
              user.destroy();

              // Select the logged in user.
              Tasks.usersController.selectObject(CoreTasks.get('currentUser'));
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
   * Logs a message indicating that the given state isn't handled in the given action.
   *
   * @param {String} action The name of the action (ex. "logout").
   * @param {String} stateName The name of the state (ex. "a").
   * @param {Integer} stateNum The number of the sate (ex. "4").
   */
  _logActionNotHandled: function(action, stateName, stateNum) {
    console.log('Error: action not handled in state %@[%@]: %@'.fmt(stateName, stateNum, action));
  },
  
  /**
   * Temporary callback to handle missing functionality.
   *
   * @param (String) name of unimmplemented function
   */
  _notImplemented: function(functionName) {
    var prefix = '';
    if(functionName) {
      prefix = functionName + '(): ';
    }
    SC.AlertPane.warn ('Unimplemented Functionality', prefix + 'Not yet implemented');
  }  
  
});
