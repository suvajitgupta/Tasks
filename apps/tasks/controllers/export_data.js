// ==========================================================================
// Tasks.exportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for the import data pane.
*/
Tasks.exportDataController = SC.ObjectController.create(
/** @scope Orion.exportDataController.prototype */ {

  data: '',
  
  openPanel: function(){
    this._exportData();
    var panel = Tasks.getPath('exportDataPage.panel');
    if(panel) panel.append();
  },

  closePanel: function(){
    var panel = Tasks.getPath('exportDataPage.panel');
    panel.remove();
    panel.destroy();
  },
  
  /**
  * Export a project's attributes.
  * @param {Object} Project to export.
  */
  _exportProject: function(project) {
    if(project.get('name') === CoreTasks.UNALLOCATED_TASKS_NAME) return '';
    else return project.get('displayName') + '\n';
  },
  
  /**
  * Export a task's attributes.
  * @param {Object} Task to export.
  */
  _exportTask: function(task) {
    var ret = '', val, user;
    switch(task.get('priority')) {
      case CoreTasks.TASK_PRIORITY_HIGH: val = '^'; break;
      case CoreTasks.TASK_PRIORITY_MEDIUM: val = '-'; break;
      case CoreTasks.TASK_PRIORITY_LOW: val = 'v'; break;
    }
    ret += val + ' ';
    ret += task.get('displayName');
    user = task.get('submitter');
    if (user) ret += ' <' + user.get('loginName') + '>';
    user = task.get('assignee');
    if (user) ret += ' [' + user.get('loginName') + ']';
    val = task.get('type');
    if(val !== CoreTasks.TASK_TYPE_OTHER) ret += ' $' + val.loc();
    val = task.get('status');
    if(val !== CoreTasks.TASK_STATUS_PLANNED) ret += ' @' + val.loc();
    val = task.get('validation');
    if(val !== CoreTasks.TASK_VALIDATION_UNTESTED)ret += ' %' + val.loc();
    val = task.get('description');
    if(val) {
      var lines = val.split('\n');
      for (var j = 0; j < lines.length; j++) {
        ret += '\n| ' + lines[j];
      }
    }
    ret += '\n';
    return ret;
  },
  
  /**
  * Export data for all projects.
  */
  _exportAllData: function() {
    var ret = '';
    var pc = Tasks.get('projectsController');
    pc.forEach(function(project){
      
      if(project.get('name') === CoreTasks.ALL_TASKS_NAME) return; // skip AllTasks Project
      ret += Tasks.exportDataController._exportProject(project);
      
      var tasks = project.get('tasks');
      var len = tasks.get('length');
      for (var i = 0; i < len; i++) {
        ret += Tasks.exportDataController._exportTask(tasks.objectAt(i));
      }
      ret += '\n';
      
    }, pc);
    return ret;
  },
  
  /**
  * Export displayed tasks.
  */
  _exportDisplayedData: function() {
    var ret = '';
    var tasksTree = Tasks.get('tasksController').get('content');
    var assignmentNodes = tasksTree.get('treeItemChildren');
    var assigneesCount = assignmentNodes.get('length');
    for(var i=0; i < assigneesCount; i++) {
      console.log("ASSIGNEE: " + assignmentNodes.objectAt(i).get('displayName'));
      var tasks = assignmentNodes.objectAt(i).get('treeItemChildren');
      var tasksCount = tasks.get('length');
      for(var j=0; j < tasksCount; j++) {
        ret += Tasks.exportDataController._exportTask(tasks.objectAt(j));
      }
    }
    return ret;
  },
  
  /**
  * Export data per Tasks file format.
  */
  _exportData: function() {
    
    var sel = Tasks.projectsController.get('selection');
    if(!sel) return false;
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    
    var ret = "# Tasks data export at " + new Date().format('hh:mm:ss a MMM dd, yyyy') + '\n\n';
    var selectedProjectName = selectedProject.get('name');
    if (selectedProjectName === CoreTasks.ALL_TASKS_NAME) {
      ret += this._exportAllData();
    }
    else {
      ret += this._exportProject(selectedProject);
      ret += this._exportDisplayedData();
    }
    
    this.set('data', ret);
    
  }

});
