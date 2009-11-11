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

  _usersLoaded: false,
  _alreadyLoggedIn: false,

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
      case 4:
        this.goState('a', 2);
        this.loginName = loginName;
        
        if (this._usersLoaded) {
          this._loginUser();
        } else { // Retrieve all users from the data source.
          if (!CoreTasks.get('allUsers')) {
            CoreTasks.set('allUsers', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.User, orderBy: 'name' })));
          } else {
            CoreTasks.get('allUsers').refresh();
          }

          this.usersController.set('content', CoreTasks.get('allUsers'));
        }

        break;

      default:
        this._logActionNotHandled('authenticate', 'a', this.state.a);  
    }
  },

  /**
   * Called after all users have been successfully loaded from the server.
   */
  usersLoadSuccess: function() {
    // console.log("DEBUG: userLoadSuccess()");
    this._usersLoaded = true;
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', "_UsersLoaded".loc());
    this._loginUser();
  },

  /**
   * Called if the request to the data source to load all users failed for some reason.
   */
  usersLoadFailure: function() {
    // console.log("DEBUG: userLoadFailure()");
    Tasks.loginController.closePanel();
    SC.AlertPane.error ('System Error', 'Unable to retrieve users from server');
  },

  /**
   * Authenticate the user by searching for a matching loginName in the list of users in the store.
   */
  _loginUser: function() {

    // console.log("DEBUG: loginUser()");
    var currentUser = CoreTasks.get('currentUser');
    if(currentUser) this._alreadyLoggedIn = true;
    else currentUser = CoreTasks.getUser(this.loginName);
    if (currentUser) { // See if a valid user
      
      if(!this._alreadyLoggedIn) {
        
        // Greet user and save login session information
        CoreTasks.set('currentUser', currentUser);
        var welcomeMessage = Tasks.getPath('mainPage.mainPane.welcomeMessage');
        welcomeMessage.set('value', "_User:".loc() + '<b>' + CoreTasks.getPath('currentUser.name') + '</b>, ' +
                           "_Role:".loc() + ' <i>' + CoreTasks.getPath('currentUser.role').loc() + '</i>');
        welcomeMessage.set('toolTip', "_LoginSince".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy'));
        
        // Based on user's role set up appropriate task filter
        var role = currentUser.get('role');
        if(role === CoreTasks.USER_ROLE_DEVELOPER) { // Set assignee selection filter to current user
          Tasks.assignmentsController.set('assigneeSelection', this.loginName);
        }
        else if(role === CoreTasks.USER_ROLE_TESTER) { // Filter out Other tasks
          Tasks.assignmentsController.attributeFilter(CoreTasks.TASK_TYPE_OTHER, 0);
        }
        
      }
      
      this._authenticationSuccess();
      
    } else {
      this._authenticationFailure();
    }
    
  },

  /**
   * Called after successful authentication.
   */
  _authenticationSuccess: function() {
    // console.log("DEBUG: authenticationSuccess()");
    switch (this.state.a) {
      case 2:
        this.goState('a', 3);
        if(!this._alreadyLoggedIn) Tasks.loginController.closePanel();
        // Load all data (projects and tasks) from the data source.
        this._loadData();
        break;

      default:
        this._logActionNotHandled('_authenticationSuccess', 'a', this.state.a);  
    }
  },

  /**
   * Called after failed authentication.
   */
  _authenticationFailure: function() {
    // console.log("DEBUG: authenticationFailure()");
    switch (this.state.a) {
      case 2:
        Tasks.loginController.displayLoginError();
        this.goState('a', 1);
        break;
      default:
        this._logActionNotHandled('_authenticationFailure', 'a', this.state.a);  
    }
  },
  
  /**
   * Load all data (projects and tasks) used by Tasks views.
   */
  _loadData: function() {
    // console.log("DEBUG: loadData()");
    // Start by loading all tasks.
    if (!CoreTasks.get('allTasks')) {
      CoreTasks.set('allTasks', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Task })));
    } else {
      CoreTasks.get('allTasks').refresh();
    }

    this.allTasksController.set('content', CoreTasks.get('allTasks'));
  },

  /**
   * Called after all tasks have been loaded from the server.
   */
  tasksLoadSuccess: function() {
    // console.log("DEBUG: tasksLoadSuccess()");
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', serverMessage.get('value') + "_TasksLoaded".loc());

    // Create these two reserved projects so that they show up first in the list of projects.

    // Create the AllTasks project to hold all tasks.
    var allTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
      name: CoreTasks.ALL_TASKS_NAME.loc()
    });
    CoreTasks.set('allTasksProject', allTasksProject);

    // Create the UnallocatedTasks project with the unallocated tasks.
    var unallocatedTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
      name: CoreTasks.UNALLOCATED_TASKS_NAME.loc()
    });
    CoreTasks.set('unallocatedTasksProject', unallocatedTasksProject);
    
    // Now load all of the projects.
    if (!CoreTasks.get('allProjects')) {
      CoreTasks.set('allProjects', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Project, orderBy: 'name' })));
    } else {
      CoreTasks.get('allProjects').refresh();
    }

    this.projectsController.set('content', CoreTasks.get('allProjects'));
    
  },

  /**
   * Called after all projects have been loaded from the server.
   */
  projectsLoadSuccess: function() {

    // console.log("DEBUG: projectsLoadSuccess()");
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', serverMessage.get('value') + "_ProjectsLoaded".loc() + new Date().format('hh:mm:ss a'));

    var defaultProject = CoreTasks.get('allTasksProject');
    var defaultProjectName = this.get('defaultProject');
    if(defaultProjectName) { // if specified via a Route
      var project = CoreTasks.getProject(defaultProjectName); // see if such a project exists
      if(project) defaultProject = project;
    }
    this.set('defaultProject', defaultProject);
    
    this.dataLoadSuccess();
  },

  /**
   * Called after successful data load.
   */
  dataLoadSuccess: function() {
    // console.log("DEBUG: dataLoadSuccess()");
    switch (this.state.a) {
      case 3:
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
        SC.AlertPane.error ('System Error', 'Unable to retrieve project/task data from server');
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
   * Clears all data loaded from server.
   */
  clearData: function() {
    this._usersLoaded = false;
    this.usersController.set('content', null);
    this.allTasksController.set('content', null);
    this.projectsController.set('content', null);
    CoreTasks.clearData();
  },
   
  /**
   * Reload latest Tasks data from server.
   */
  // TODO: [SG, SE] implement incremental refresh that doesn't reload/redraw everything on screen
  refreshData: function() {
    this.clearData();
    this.authenticate(this.loginName, 'password'); // TODO: [SG] replace with actual password
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
    this._alreadyLoggedIn = false;
    this.get('assignmentsController').resetFilters();
    this.clearData();
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
    
    var currentUser = CoreTasks.get('currentUser');
    if(!currentUser || currentUser.get('role') !== CoreTasks.USER_ROLE_MANAGER) {
      console.log('Error: permission denied based on user role');
      return null;
    }
    
    // Create, select, and begin editing new project.
    var project = CoreTasks.createRecord(CoreTasks.Project, { name: CoreTasks.NEW_PROJECT_NAME.loc() } );
    var pc = this.projectsController;
    pc.selectObject(project);
    CoreTasks.invokeLater(pc.editNewProject, 200, project);
    return project;
  },
  
  /**
   * Delete selected project in master projects list.
   *
   @returns {Boolean} YES if the deletion was a success.
   */
  deleteProject: function() {
    
    var currentUser = CoreTasks.get('currentUser');
    if(!currentUser || currentUser.get('role') !== CoreTasks.USER_ROLE_MANAGER) {
      console.log('Error: permission denied based on user role');
      return null;
    }
    
    // Get the selected project, if one
    var project = Tasks.projectsController.getPath('selection.firstObject');
    if (project) {

      // Confirm deletion for projects that have tasks
      var tasks = project.get('tasks');
      var taskCount = tasks.get('length');
      if(taskCount > 0) {
        // FIXME: [SG] Beta: see how to get confirm dialog modal behavior
        var aborted = false;
        SC.AlertPane.warn("_Confirmation".loc(), "_ProjectDeletionConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
          SC.Object.create({
            alertPaneDidDismiss: function(pane, status) {
              if(status === SC.BUTTON2_STATUS) aborted = true;
            }
          })
        );
        if(aborted) return NO;
      }

      // Reset default project if it is deleted
      if(project === Tasks.get('defaultProject')) Tasks.set('defaultProject', CoreTasks.get('allTasksProject'));

      // Delete the project
      project.destroy();
      
      // Select the default project
      this.projectsController.selectObject(Tasks.get('defaultProject'));
      
      return YES;
      
    }
  },
  
  /**
   * Add a new task to tasks detail list.
   */
  addTask: function() {
    
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
  addUser: function() {
    // Create and select new user.
    var user = CoreTasks.createRecord(CoreTasks.User, SC.clone(CoreTasks.User.NEW_USER_HASH));
    Tasks.usersController.selectObject(user);
    return user;
  },

  /**
   * Delete selected user.
   */
  deleteUser: function() {
  
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
