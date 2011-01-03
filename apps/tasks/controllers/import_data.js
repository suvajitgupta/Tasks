// ==========================================================================
// Tasks.importDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Brandon Blatnick
  @author Suvajit Gupta
  
  Controller for the import data pane.
*/
Tasks.importDataController = SC.ObjectController.create(
/** @scope Tasks.importDataController.prototype */ {
  
  createMissingUsers: false,
  importData: '',
  
  openPanel: function(){
    var panel = Tasks.getPath('importDataPage.panel');
    if(panel) {
      panel.append();
      panel.focus();
    }
  },
  
  /**
   * Parse data and create/load objects.
   */
  parseAndLoadData: function() {
    
    // Cache shouldNotify and turn off during importing
    var shouldNotify = CoreTasks.get('shouldNotify');
    CoreTasks.set('shouldNotify', false);
    
    var store = CoreTasks.get('store');
    var currentUserId = CoreTasks.getPath('currentUser.id');
    var currentProject = null;
    var createMissingUsers = this.get('createMissingUsers');
    var importData = this.get('importData');
    var lines = importData.split('\n');
    var description, nextLine, descriptionLine;

    for (var i = 0; i < lines.length; i++) {

      var line = lines[i].replace(/^\s+/, '');

      if (line.indexOf('#') === 0) { // a Comment
        var commentLine = line.slice(1);
        // console.log('Commment:\t' + commentLine);
      }
      else if (line.match(/^\[/)) { // a User
        var userHash = CoreTasks.User.parse(line);
        this._createUserFromHash(userHash);
      }
      else if (line.match(/^[\^\-v][ ]/)) { // a Task

        var taskHash = CoreTasks.Task.parse(line);
        // console.log ('Task:\t\t' + JSON.stringify(taskHash));

        if(taskHash.assigneeId) {
        var assigneeUser = CoreTasks.getUserByLoginName(taskHash.assigneeId);
          if (assigneeUser) {
            taskHash.assigneeId = assigneeUser.get('id');
          }
          else if (createMissingUsers) {
            assigneeUser = this._createUserFromLoginName(taskHash.assigneeId);
            if(assigneeUser) taskHash.assigneeId = assigneeUser.get('id');
          }
          else {
            console.warn('Task Import Error - no such assignee: ' + taskHash.assigneeId);
            taskHash.assigneeId = null;
          }
        }

        if(taskHash.submitterId) {
          var submitterUser = CoreTasks.getUserByLoginName(taskHash.submitterId);
          if (submitterUser) {
            taskHash.submitterId = submitterUser.get('id');
          }
          else if (createMissingUsers) {
            submitterUser = this._createUserFromLoginName(taskHash.submitterId);
            if(submitterUser) taskHash.submitterId = submitterUser.get('id');
          }
          else {
            console.warn('Task Import Error - no such submitter: ' + taskHash.submitterId);
            taskHash.submitterId = null;
          }
        }

        // Peek ahead to the next lines to see if there is a Description and bring those in
        description = null;
        while (i < (lines.length-1)) {
          nextLine = lines[++i].replace(/^\s+/, '');
          if (nextLine.indexOf('| ') === 0) { // a Description line
            descriptionLine = nextLine.slice(2);
            description = (description? (description + '\n') : '') + descriptionLine;
          }
          else {
            i--;
            break;
          }
        }
        if(description) {
          taskHash.description = description;
          // console.log('Description:\t' + description);
        }
        
        // Add task to current project, if one has already been encountered
        if(currentProject) taskHash.projectId = currentProject.get('id');
        
        var taskRecord = CoreTasks.createRecord(CoreTasks.Task, taskHash);
        if(!taskRecord) console.error('Import: task creation failed');
      }
      else if (line.search(/^\s*$/) === 0) { // a blank line
        // console.log('Blank Line:');
      }
      else { // a Project
        var projectHash = CoreTasks.Project.parse(line);
        // console.log ('Project:\t\t' + JSON.stringify(projectHash));
        
        // Peek ahead to the next lines to see if there is a Description and bring those in
        description = null;
        while (i < (lines.length-1)) {
          nextLine = lines[++i].replace(/^\s+/, '');
          if (nextLine.indexOf('| ') === 0) { // a Description line
            descriptionLine = nextLine.slice(2);
            description = (description? (description + '\n') : '') + descriptionLine;
          }
          else {
            i--;
            break;
          }
        }
        if(description) {
          projectHash.description = description;
          // console.log('Description:\t' + description);
        }
        
        var projectRecord = CoreTasks.getProjectByName(projectHash.name);
        if(projectRecord) { // existing project - switch to it
          if(CoreTasks.getPath('currentUser.role') !== CoreTasks.USER_ROLE_GUEST) currentProject = projectRecord;
        }
        else { // create new project if allowed and switch to it if allowed
          if(CoreTasks.getPath('permissions.canCreateProject')) {
            projectRecord = CoreTasks.createRecord(CoreTasks.Project, projectHash);
            if(projectRecord) {
              if(projectHash.activatedAt) projectRecord.set('activatedAt', SC.DateTime.parse(projectHash.activatedAt, CoreTasks.DATE_FORMAT));
              currentProject = projectRecord;
            }
            else console.error('Import: project creation failed!');
          }
          else {
            console.warn('Task Import Error - you do not have permission to create project: ' + projectHash.name);
          }
        }
      }
    }
    
    if(CoreTasks.get('autoSave')) Tasks.saveData();
    CoreTasks.set('shouldNotify', shouldNotify); // restore cached value
    this.set('importData','');
    
    Tasks.statechart.gotoState('loggedIn.globals.ready');
    
  },
  
  _createUserFromLoginName: function(loginName) {
    var userHash = SC.merge(SC.clone(CoreTasks.User.NEW_USER_HASH), { 'name': loginName, 'loginName': loginName });
    return this._createUserFromHash(userHash);
  },
  
  _createUserFromHash: function(userHash) {
    // console.log('DEBUG: Creating new user: ' + userHash);
    var user = null;
    if(SC.none(userHash.loginName) || SC.none(userHash.name)) {
      console.error('Cannot create user without a valid loginName and name');
    }
    else {
      user = CoreTasks.getUserByLoginName(userHash.loginName);
      if(user) { // existing user
        // console.log('DEBUG: Existent user: ' + userHash.loginName);
      }
      else { // create user
        SC.RunLoop.begin();
        user = CoreTasks.createRecord(CoreTasks.User, userHash);
        SC.RunLoop.end();
      }
    }
    return user;
  }
    
});
