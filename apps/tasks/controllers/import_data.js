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
/** @scope Orion.importDataController.prototype */ {
  
    importData: '',
    
    openPanel: function(){
      var panel = Tasks.getPath('importDataPage.panel');
      if(panel) {
        panel.append();
        panel.focus();
      }
    },
    
    closePanel: function(){
      this.set('importData','');
      var panel = Tasks.getPath('importDataPage.panel');
      if(panel) {
        panel.remove();
        panel.destroy();
      }
    },
    
    /**
     * Parse data and create/load objects.
     *
     * @param {String} data to be parsed.
     */
    parseAndLoadData: function() {
      
      var data = this.get('importData');
      var lines = data.split('\n');
      var store = CoreTasks.get('store');
      var currentProject = null;
      var description, nextLine, descriptionLine;

      for (var i = 0; i < lines.length; i++) {

        var line = lines[i];

        if (line.indexOf('#') === 0) { // a Comment
          var commentLine = line.slice(1);
          // console.log('Commment:\t' + commentLine);
        }
        else if (line.match(/^[\^\-v][ ]/)) { // a Task

          var taskHash = CoreTasks.Task.parse(line);
          // console.log ('Task:\t\t' + JSON.stringify(taskHash));

          if(taskHash.assigneeId) {
          var assigneeUser = CoreTasks.getUser(taskHash.assigneeId);
            if (assigneeUser) {
              taskHash.assigneeId = assigneeUser.get('id');
            }
            else {
              console.log('Task Import Error - no such assignee: ' + taskHash.assigneeId);
              taskHash.assignee = null;
            }
          }

          if(taskHash.submitterId) {
            var submitterUser = CoreTasks.getUser(taskHash.submitterId);
            if (submitterUser) {
              taskHash.submitterId = submitterUser.get('id');
              
            }
            else {
              console.log('Task Import Error - no such submitter: ' + taskHash.submitterId);
              taskHash.submitter = null;
            }
          }

          // Peek ahead to the next line(s) to see if there is a Description and bring those in
          description = null;
          while (i < (lines.length-1)) {
            nextLine = lines[++i];
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
          if(!taskRecord) console.log('Task Import Error: task creation failed');
        }
        else if (line.search(/^\s*$/) === 0) { // a blank line
          // console.log('Blank Line:');
        }
        else { // a Project
          var projectHash = CoreTasks.Project.parse(line);
          // console.log ('Project:\t\t' + JSON.stringify(projectHash));
          
          var projectRecord = CoreTasks.getProject(projectHash.name);
          if(projectRecord) {
            currentProject = projectRecord;
          }
          else {
            // Peek ahead to the next line(s) to see if there is a Description and bring those in
            description = null;
            while (i < (lines.length-1)) {
              nextLine = lines[++i];
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
            
            projectRecord = CoreTasks.createRecord(CoreTasks.Project, projectHash);
            if(projectRecord) {
              currentProject = projectRecord;
            }
            else {
              console.log('Project Import Error: project creation failed!');
            }
          }
        }
      }
      
      Tasks.assignmentsController.showAssignments();
      this.closePanel();
      
    }    
});
