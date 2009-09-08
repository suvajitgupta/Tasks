// ==========================================================================
// Tasks.ImportDataController
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
/** @scope Orion.importDataController.prototype */ {
  
    importData: '',
    currentProject: null,
    projectTaskMappings: null,
    
    openPanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      if(panel) panel.append();
    },
    
    closePanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      panel.remove();
      panel.destroy();
      this.set('importData','');
    },
    
    /**
     * Parse data and create/load objects.
     *
     * @param {String} data to be parsed.
     */
    parseAndLoadData: function() {
      
      var data = this.get('importData');
      this.projectTaskMappings = {};
      var lines = data.split('\n');
      var store = CoreTasks.get('store');
      var currentProject = CoreTasks.get('inbox');

      for (var i = 0; i < lines.length; i++) {

        var line = lines[i];

        if (line.indexOf('#') === 0) { // a Comment
          var commentLine = line.slice(1);
          // console.log('Commment:\t' + commentLine);
        }
        else if (line.match(/^[\^\-v][ ]/)) { // a Task

          var taskHash = CoreTasks.Task.parse(line);
          // console.log ('Task:\t\t' + JSON.stringify(taskHash));

          if(taskHash.assignee) {
          var assigneeUser = CoreTasks.getUser(taskHash.assignee);
            if (assigneeUser) {
              taskHash.assignee = assigneeUser.get('id');
            }
            else {
              console.log('Task Import Error - no such assignee: ' + taskHash.assignee);
              continue;
            }
          }

          if(taskHash.submitter) {
            var submitterUser = CoreTasks.getUser(taskHash.submitter);
            if (submitterUser) {
              taskHash.submitter = submitterUser.get('id');
            }
            else {
              console.log('Task Import Error - no such submitter: ' + taskHash.submitter);
              continue;
            }
          }

          // Peek ahead to the next line(s) to see if there is a Description and bring those in
          var description = null;
          while (i < (lines.length-1)) {
            var nextLine = lines[++i];
            if (nextLine.indexOf('| ') === 0) { // a Description line
              var descriptionLine = nextLine.slice(2);
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

          // taskHash.id = CoreTasks.generateId(); // For FIXTUREs

          var taskRecord = store.createRecord(CoreTasks.Task, taskHash);
          if(!taskRecord) {
            console.log('Task Import Error: task creation failed');
            continue;
          }
          this.projectTaskMappings[taskRecord.get('name')] = currentProject.get('name');

          // Immediately try to commit the task so that we get an ID.
          var params = {
            successCallback: this._addTaskFromImportSuccess.bind(this),
            failureCallback: this._addTaskFromImportFailure.bind(this)
          };
          taskRecord.commitRecord(params);
        }
        else if (line.search(/^\s*$/) === 0) { // a blank line
          // console.log('Blank Line:');
        }
        else { // a Project
          var projectHash = CoreTasks.Project.parse(line);
          // console.log ('Project:\t\t' + JSON.stringify(projectHash));
          
          var project = CoreTasks.getProject(projectHash.name);
          if(project) {
            currentProject = project;
          }
          else {
            project = store.createRecord(CoreTasks.Project, projectHash);
            if(project) {
              currentProject = project;
              Tasks.get('projectsController').addObject(project);
            }
            else {
              console.log('Project Import Error: project creation failed!');
            }
          }
        }
      }
      
      Tasks.assignmentsController.showAssignments();
      this.closePanel();
      
    },
    
    _addTaskFromImportSuccess: function(storeKey) {
      var taskRecord = CoreTasks.get('store').materializeRecord(storeKey);
      CoreTasks.get('allTasks').addTask(taskRecord);
      var projectName = this.projectTaskMappings[taskRecord.get('name')];
      if(projectName) {
        // console.log("DEBUG: task: " + taskRecord.get('name') + ", project: " + projectName);
        var currentProject = CoreTasks.getProject(projectName);
        if(currentProject) currentProject.addTask(taskRecord);
      }
    },

    _addTaskFromImportFailure: function(storeKey) {
    }
    
});
