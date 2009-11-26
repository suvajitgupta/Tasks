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
/** @scope Tasks.exportDataController.prototype */ {

  data: '',
  
  openPanel: function(){
    this._exportData();
    var panel = Tasks.getPath('exportDataPage.panel');
    if(panel) panel.append();
  },

  closePanel: function(){
    var panel = Tasks.getPath('exportDataPage.panel');
    if(panel) {
      panel.remove();
      panel.destroy();
    }
  },
  
  /**
  * Export data for a project.
  *
  * @param {Object} project whose data is to be exported.
  * @returns {String) return a string with project/task data exported in it.
  */
  _exportProjectData: function(project) {
    
    var ret = '';
    var tasks = project.get('tasks');
    var len = tasks.get('length');
    
    ret += project.exportData();
    for (var i = 0; i < len; i++) {
      ret += tasks.objectAt(i).exportData();
    }
    ret += '\n';
    
    return ret;
    
  },
  
  /**
  * Export data for all projects.
  * @returns {String) return a string with all Tasks data exported in it.
  */
  _exportAllData: function() {
    
    var ret = '';
    var pc = Tasks.get('projectsController');
    var that = this;
    
    // First export unallocated tasks
    pc.forEach(function(project){
      var name = project.get('name');
      if(name === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
        var tasks = project.get('tasks');
        var len = tasks.get('length');
        if(len === 0 && name === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return; // skip empty UnallocatedTasks Project
        ret += that._exportProjectData(project);
      }
    }, pc);
    
    // Next export allocated tasks
    pc.forEach(function(project){
      var name = project.get('name');
      if(name === CoreTasks.ALL_TASKS_NAME.loc() || name === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return; // skip All and Unallocated Tasks Projects
      ret += that._exportProjectData(project);
    }, pc);
    
    return ret;
    
  },

  /**
  * Export displayed tasks.
  * @returns {String) return a string with displayed Tasks data exported in it.
  */
  _exportDisplayedData: function() {
    
    var ret = '';
    var tasksTree = Tasks.get('tasksController').get('content');
    var assignmentNodes = tasksTree.get('treeItemChildren');
    var assigneesCount = assignmentNodes.get('length');
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      var tasks = assignmentNode.get('treeItemChildren');
      var tasksCount = assignmentNode.get('tasksCount');
      ret += '\n# ' + assignmentNode.get('displayName').loc() + '; ' + "_Has".loc() + tasksCount + "_Tasks".loc() + '\n';
      if(tasks) {
        for(var j=0; j < tasksCount; j++) {
          ret += tasks.objectAt(j).exportData();
        }
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
    
    var ret = "_TasksExportTimestamp".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy') + '\n\n';
    var selectedProjectName = selectedProject.get('name');
    if (selectedProjectName === CoreTasks.ALL_TASKS_NAME.loc() && !Tasks.assignmentsController.hasFiltering()) {
      ret += this._exportAllData();
    }
    else {
      ret += selectedProject.exportData();
      ret += this._exportDisplayedData();
    }
    
    this.set('data', ret);
    
  }

});
