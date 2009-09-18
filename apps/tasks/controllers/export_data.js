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
  * Export data for all projects.
  * @returns {String) return a string with all Tasks data exported in it.
  */
  _exportAllData: function() {
    var ret = '';
    var pc = Tasks.get('projectsController');
    pc.forEach(function(project){
      
      if(project.get('name') === CoreTasks.ALL_TASKS_NAME.loc()) return; // skip AllTasks Project
      ret += project.exportData();
      
      var tasks = project.get('tasks');
      var len = tasks.get('length');
      for (var i = 0; i < len; i++) {
        ret += tasks.objectAt(i).exportData();
      }
      if (len > 0) ret += '\n';
      
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
      console.log("ASSIGNEE: " + assignmentNodes.objectAt(i).get('displayName'));
      var tasks = assignmentNodes.objectAt(i).get('treeItemChildren');
      var tasksCount = tasks.get('length');
      for(var j=0; j < tasksCount; j++) {
        ret += tasks.objectAt(j).exportData();
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
