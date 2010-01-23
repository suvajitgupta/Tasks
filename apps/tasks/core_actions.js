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

  loginTime: true, // to indicate when there is a login sequence in progress
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
        var params = {
          successCallback: this.authenticationSuccess.bind(this),
          failureCallback: this.authenticationFailure.bind(this)
        };
        // Perservere authentication
        CoreTasks.User.authenticate(loginName, password, params);
        break;

      default:
        this._logActionNotHandled('authenticate', 'a', this.state.a);  
    }
  },
  
  /**
   * Called after successful authentication.
   */
  authenticationSuccess: function() {
    // console.log('DEBUG: authenticationSuccess()');
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
    // console.log('DEBUG: authenticationFailure()');
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
    // console.log('DEBUG: loadData()');
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
    // console.log('DEBUG: usersLoadSuccess()');
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', "_UsersLoaded".loc());
    
    // Set the current logged on user
    var currentUser = CoreTasks.getUser(this.loginName);
    if (currentUser) {
      
      if(this.loginTime) {
        
        // Greet user and save login session information
        CoreTasks.set('currentUser', currentUser);
        CoreTasks.setPermissions();
        
        var userNameMessage = Tasks.getPath('mainPage.mainPane.userNameMessage');
        userNameMessage.set('toolTip', "_LoginSince".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy'));
        
        // Based on user's role set up appropriate task filter
        var role = currentUser.get('role');
        
        if(role === CoreTasks.USER_ROLE_DEVELOPER) { // Set assignee selection filter to current user
          Tasks.assignmentsController.set('assigneeSelection', this.loginName);
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
    // console.log('DEBUG: tasksLoadSuccess()');
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', serverMessage.get('value') + "_TasksLoaded".loc());

    // Create the AllTasks project to hold all tasks.
    if(!CoreTasks.get('allTasksProject')) {
      var allTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.ALL_TASKS_NAME.loc()
      });
      CoreTasks.set('allTasksProject', allTasksProject);
      CoreTasks.set('needsSave', NO);
    }

    // Create the UnallocatedTasks project with the unallocated tasks.
    if(!CoreTasks.get('unallocatedTasksProject')) {
      var unallocatedTasksProject = CoreTasks.createRecord(CoreTasks.Project, {
        name: CoreTasks.UNALLOCATED_TASKS_NAME.loc()
      });
      CoreTasks.set('unallocatedTasksProject', unallocatedTasksProject);
      CoreTasks.set('needsSave', NO);
    }
    
    // Now load all of the projects.
    if (!CoreTasks.get('allProjects')) {
      CoreTasks.set('allProjects', CoreTasks.store.find(SC.Query.create({ recordType: CoreTasks.Project })));
      this.projectsController.set('content', CoreTasks.get('allProjects'));
    } else {
      CoreTasks.get('allProjects').refresh();
    }
    
  },

  /**
   * Called after all projects have been loaded from the server.
   */
  projectsLoadSuccess: function() {

    // console.log('DEBUG: projectsLoadSuccess()');
    var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
    serverMessage.set('value', serverMessage.get('value') + "_ProjectsLoaded".loc() + new Date().format('hh:mm:ss a'));

    if(this.loginTime) {
      var defaultProject = CoreTasks.get('unallocatedTasksProject');
      var defaultProjectName = this.get('defaultProjectName');
      if(defaultProjectName) { // if specified via a Route
        var project = CoreTasks.getProject(defaultProjectName); // see if such a project exists
        if(project) defaultProject = project;
      }
      this.set('defaultProject', defaultProject);
    }
    
    this.dataLoadSuccess();
  },

  /**
   * Called after successful data load.
   */
  dataLoadSuccess: function() {
    // console.log('DEBUG: dataLoadSuccess()');
    switch (this.state.a) {
      case 3:
        if(this.loginTime) {
          this.loginTime = false;
          this.projectsController.selectObject(this.get('defaultProject'));
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
    // console.log('DEBUG: dataLoadFailure()');
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
    if(CoreTasks.get('needsSave')) {
      CoreTasks.saveChanges();
      var serverMessage = Tasks.getPath('mainPage.mainPane.serverMessage');
      serverMessage.set('value', "_SaveMessage".loc() + new Date().format('hh:mm:ss a'));
    }
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
    SC.AlertPane.warn("_Confirmation".loc(), "_LogoutConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
      SC.Object.create({
        alertPaneDidDismiss: function(pane, status) {
          if(status === SC.BUTTON2_STATUS) {
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
      SC.AlertPane.warn("_Confirmation".loc(), "_SaveConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON2_STATUS) {
              Tasks.saveAndExit();
            }
            else if(status === SC.BUTTON1_STATUS){
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
    
    Tasks.getPath('mainPage.mainPane.userNameMessage').set('value', null);
    Tasks.getPath('mainPage.mainPane.userRoleMessage').set('value', null);
    CoreTasks.set('currentUser', null);
    this.loginTime = true;
    
    // TODO: [JH2, SG] Beta: need to determine the backend and logout appropriately
    // var params = {
    //   successCallback: function() { console.log('Successful logout'); }.bind(this),
    //   failureCallback: function() { console.log('Failed logout'); }.bind(this)
    // };
    // CoreTasks.User.logout('logout', params);
    
    this.get('assignmentsController').resetFilters();
    this.usersController.set('content', null);
    this.allTasksController.set('content', null);
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
    
    if(!CoreTasks.getPath('permissions.canAddProject')) {
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
    }
    
    // Create, select, and begin editing new project.
    var project = CoreTasks.createRecord(CoreTasks.Project, projectHash);
    var pc = this.projectsController;
    pc.selectObject(project);
    CoreTasks.invokeLater(pc.editNewProject, 200, project);
    if(Tasks.get('autoSave')) Tasks.saveData();
    return project;
  },
  
  /**
   * Delete selected project in master projects list, asking for confirmation if project has tasks.
   */
  deleteProject: function() {
    
    if(!CoreTasks.getPath('permissions.canDeleteProject')) {
      console.warn('You do not have permission to delete a project');
      return;
    }
    
    // Get the selected project, if one
    var selectedProject = Tasks.projectsController.getPath('selection.firstObject');
    if (selectedProject) {

      // Disallow deletion of system projects
      if (CoreTasks.isSystemProject(selectedProject)) {
        console.warn('You cannot delete a system project');
        return;
      }
      
      // Confirm deletion operation
      SC.AlertPane.warn("_Confirmation".loc(), "_ProjectDeletionConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON2_STATUS) {
              // Reset default project if it is deleted
              if(selectedProject === Tasks.get('defaultProject')) Tasks.set('defaultProject', CoreTasks.get('unallocatedTasksProject'));

              // Delete the project
              selectedProject.destroy();

              // Select the default project
              Tasks.projectsController.selectObject(Tasks.get('defaultProject'));
              if(Tasks.get('autoSave')) Tasks.saveData();
            }
          }
        })
      );
    }
  },

  /**
   * Popup Project Statistics panel.
   */
  projectStatistics: function() {
    Tasks.projectController.showStatistics();  
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
    Tasks.tasksController.selectObject(task);
    var ac = this.get('assignmentsController');  
    CoreTasks.invokeLater(ac.showAssignments.bind(ac));
    CoreTasks.invokeLater(tc.editNewTask, 200, task);
    if(Tasks.get('autoSave')) Tasks.saveData();
    return task;
        
  },

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
      SC.AlertPane.warn("_Confirmation".loc(), "_TaskDeletionConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
      SC.Object.create({
        alertPaneDidDismiss: function(pane, status) {
          if(status === SC.BUTTON2_STATUS) {
            var context = {};
            for (var i = 0; i < len; i++) {
              // Get and delete each selected task.
              var task = sel.nextObject(i, null, context);
              task.destroy();
            }
            Tasks.deselectTasks();
            if(Tasks.get('autoSave')) Tasks.saveData();
          }
        }
        })
      );

    }
  },
  
  /**
   * Copy selected task's ID/name into clipboard.
   */
  copyTaskIDName: function() {
    this._notImplemented('Copy Task ID/Name');
  },
  
  /**
   * Copy selected task's link (URL to route to) into clipboard.
   */
  copyTaskLink: function() {
    this._notImplemented('Copy Task Link');
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

    if(!CoreTasks.getPath('permissions.canAddUser')) {
      console.warn('You do not have permission to add a user');
      return null;
    }
    
    // Create and select new user.
    var user = CoreTasks.createRecord(CoreTasks.User, SC.clone(CoreTasks.User.NEW_USER_HASH));
    Tasks.usersController.selectObject(user);
    Tasks.settingsPage.get('userInformation').get('fullNameField').becomeFirstResponder();
    if(Tasks.get('autoSave')) Tasks.saveData();
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
      SC.AlertPane.warn("_Confirmation".loc(), "_UserDeletionConfirmation".loc(), null, "_No".loc(), "_Yes".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON2_STATUS) {
              var context = {};
              for (var i = 0; i < len; i++) {
                // Get and delete each selected user.
                var user = sel.nextObject(i, null, context);
                user.destroy();
              }
              // Select the logged in user.
              Tasks.usersController.selectObject(CoreTasks.get('currentUser'));
              if(Tasks.get('autoSave')) Tasks.saveData();
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
