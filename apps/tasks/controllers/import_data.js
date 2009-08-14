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
/** @scope Orion.ImportDataController.prototype */ {
    data: '',
    currentProject: null,
    
    openPanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      if(panel) panel.append();
    },
    
    closePanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      panel.remove();
      panel.destroy();
      this.set('data','');
    },
    
    importData: function(){
      this._parseAndLoadData(this.get('data'));
      Tasks.assignmentsController.showAssignments();
      this.closePanel();
    },
    
    /**
     * Parse data and create/load objects.
     *
     * @param {String} data to be parsed.
     */
    _parseAndLoadData: function(data) {
      
      var lines = data.split('\n');
      var store = CoreTasks.get('store');
      var currentProject = CoreTasks.get('inbox');

      for (var i = 0; i < lines.length; i++) {

        var line = lines[i];

        if (line.indexOf('#') === 0) { // a Comment
          var commentLine = line.slice(1);
          console.log('Commment:\t' + commentLine);
        }
        else if (line.match(/^[\^\-v][ ]/)) { // a Task

          var taskHash = CoreTasks.Task.parse(line);
          console.log ('Task:\t\t' + JSON.stringify(taskHash));

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

          // taskHash.id = CoreTasks.generateId(); // For FIXTUREs

          var taskRecord = store.createRecord(CoreTasks.Task, taskHash);
          if(!taskRecord) {
            console.log('Import Error: task creation failed');
            continue;
          }

          // Immediately try to commit the task so that we get an ID.
          console.log("DEBUG: current project is: " + currentProject.get('name'));
          var that = this;
          var params = {
            successCallback: function(storeKey) {
              that._addTaskFromImportSuccess(storeKey, currentProject);
            },
            
            failureCallback: function(storeKey) {
              that._addTaskFromImportFailure(storeKey, currentProject);
            }
          };

          taskRecord.commitRecord(SC.clone(params));
        }
        else if (line.indexOf('| ') === 0) { // a Description
          var descriptionLine = line.slice(2);
          console.log('Description:\t' + descriptionLine);
          // TODO: [SG] aggregate multi-line task description & assign to last task
        }
        else if (line.search(/^\s*$/) === 0) { // a blank line
          console.log('Blank Line:');
        }
        else { // a Project
          var projectHash = CoreTasks.Project.parse(line);
          console.log ('Project:\t\t' + JSON.stringify(projectHash));
          
          if(CoreTasks.isExistingProject(projectHash.name)) continue;
          
          var project = store.createRecord(CoreTasks.Project, projectHash);
          if(project) {
            currentProject = project;
            Tasks.get('projectsController').addObject(project);
          }
          else {
            console.log('Project Import Error: project creation failed!');
          }
        }
      }
    },
    
    _addTaskFromImportSuccess: function(storeKey, project) {
      var taskRecord = CoreTasks.get('store').materializeRecord(storeKey);
      console.log("DEBUG: adding to project " + project.get('name'));
      project.addTask(taskRecord);
      CoreTasks.get('allTasks').addTask(taskRecord);
    },

    _addTaskFromImportFailure: function(storeKey, project) {
      // TODO: [SE] Implement addTaskFromImportFailure
    }
    
});
