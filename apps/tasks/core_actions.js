/**
 * A mixin that defines all of the "actions" that trigger state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit GÏupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks sc_require */
sc_require('core');
sc_require('controllers/users');
sc_require('controllers/tasks');
sc_require('controllers/projects');

Tasks.mixin({

  _usersLoaded: false,

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
        this.loginName = loginName;
        
        if (this._usersLoaded) {
          this._loginUser();
        } else { // Retrieve all users from the data source.
          if (!CoreTasks.get('allUsers')) {
            CoreTasks.set('allUsers', CoreTasks.store.find(SC.Query.local(CoreTasks.User, { orderBy: 'name' })));
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
    serverMessage.set('value', serverMessage.get('value') + "_UsersLoaded".loc());
    this._loginUser();
  },

  /**
   * Called if the request to the data source to load all users failed for some reason.
   */
  usersLoadFailure: function() {
    // console.log("DEBUG: userLoadFailure()");
    Tasks.loginController.closePanel();
    alert('System Error: Unable to retrieve users from server');
  },

  /**
   * Authenticate the user by searching for a matching loginName in the list of users in the store.
   */
  _loginUser: function() {

    // console.log("DEBUG: loginUser()");
    var user = CoreTasks.getUser(this.loginName);
    if (user) { // See if a valid user
      
      // Greet user and save login session information
      CoreTasks.set('user', user);
      var welcomeMessage = Tasks.getPath('mainPage.mainPane.welcomeMessage');
      welcomeMessage.set('value', "_User:".loc() + '<b>' + CoreTasks.getPath('user.name') + '</b>, ' +
                         "_Role:".loc() + ' <i>' + CoreTasks.getPath('user.role').loc() + '</i>');
      welcomeMessage.set('toolTip', "_LoginSince".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy'));
      
      // Based on user's rolem set up appropriate task filter
      var role = user.get('role');
      if(role === CoreTasks.USER_ROLE_DEVELOPER) { // Set assignee selection filter to logged in user
        Tasks.assignmentsController.set('assigneeSelection', this.loginName);
      }
      else if(role === CoreTasks.USER_ROLE_TESTER) { // Filter out Other tasks
        Tasks.assignmentsController.attributeFilter(CoreTasks.TASK_TYPE_OTHER, 0);
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
        Tasks.loginController.closePanel();
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
      CoreTasks.set('allTasks', CoreTasks.store.find(SC.Query.local(CoreTasks.Task)));
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
      CoreTasks.set('allProjects', CoreTasks.store.find(SC.Query.local(CoreTasks.Project, { orderBy: 'name' })));
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
    serverMessage.set('value', serverMessage.get('value') + "_ProjectsLoaded".loc());

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
        alert('System Error: Unable to retrieve project/task data from server');
        break;
      default:
        this._logActionNotHandled('dataLoadFailure', 'a', this.state.a);  
    }
  },
  
  /**
   * Save modified data to persistent store.
   */
  saveData: function() {
    CoreTasks.saveChanges();
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', "_SaveMessage".loc() + new Date().format('hh:mm:ss a'));
  },
  
  /**
   * Import data from external text file.
   */
  importData: function() {
    // FIXME: [SE] Beta: fix imported tasks disappearing from project after Save, then reappearing after re-login
    Tasks.importDataController.openPanel();  
  },

  /**
   * Export data to external text file.
   */
  exportData: function() {
    Tasks.exportDataController.openPanel();  
  },
  
  /**
   * Launch new browser/tab to display online help.
   */
   /**
    * Launch task editor dialog.
    */
  settings: function() {
   Tasks.settingsController.openPanel();
  },

  help: function() {
    Tasks.helpController.openPanel();
  },
  
  /**
   * Handle application exiting request.
   */
  logout: function() {
    
    if(confirm("_LogoutConfirmation".loc())) {
      
      Tasks.getPath('mainPage.mainPane.welcomeMessage').set('value', null);
      this._usersLoaded = false;
      this.usersController.set('content', null);
      this.allTasksController.set('content', null);
      this.projectsController.set('content', null);
      CoreTasks.clearData();
      this.get('assignmentsController').resetFilters();
      
      this.goState('a', 1);
      
    }
    
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
    
    // Get the selected project.
    var pc = this.get('projectsController');
    var sel = pc.get('selection');
    
    if (sel && sel.length() > 0) {
      var project = sel.firstObject();

      // Confirm deletion for projects that have tasks
      var projectTasks = project.get('tasks');
      var taskCount = projectTasks.get('length');
      if(taskCount > 0) {
        if(!confirm("_ConfirmProjectDeletion".loc())) return NO;
      }

      // Remove the project from the list and destroy.
      project.destroy();
      
      // Select the first project in the list.
      var projectsList = Tasks.getPath('mainPage.mainPane.projectsList');
      projectsList.select(0);
      
    }
    return YES;
  },
  
  /**
   * Add a new task to tasks detail list.
   */
  addTask: function() {
    
    // Create a new task with the logged in user as the default submitter/assignee.
    var userId = CoreTasks.getPath('user.id');
    var taskHash = SC.merge({ 'submitterId': userId, 'assigneeId': userId }, SC.clone(CoreTasks.Task.NEW_TASK_HASH));
    taskHash.name = taskHash.name.loc();

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
        // Get and remove task from the assignments controller and destroy.
        var task = sel.nextObject(i, null, context);
        task.destroy();
      }
      tc.set('selection', null);
      // FIXME: [SE] Beta: fix deleted task erroneously moving to UnallocatedTasks, after Save deleted tasks become "_NewTask", clears up after re-login
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
    var uc = this.get('usersController');
    var sel = uc.get('selection');
  
    if (sel && sel.length() > 0) {
      var user = sel.firstObject();

      // Confirm deletion of user
      if(!confirm("Are you sure you want to delete this user?")) return;

      // Delete user.
      user.destroy();
    
      // Select the first user in the list.
      var listView = Tasks.getPath('settingsPage.panel.usersList');
      listView.select(0);
      listView.scrollToContentIndex(0); // FIXME: [SC] not scrolling to selected item when it is not in view
    
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
    alert (prefix + 'Not yet implemented');
  }  
  
});
