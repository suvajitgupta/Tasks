// ==========================================================================
// Tasks.exportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller exporting data.
*/
Tasks.exportDataController = SC.ObjectController.create(
/** @scope Tasks.exportDataController.prototype */ {

  data: '',
  
  openPanel: function(){
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
   * @param {String} format in which data is to be exported.
   * @returns {String) return a string with project/task data exported in it.
   */
  _exportProjectData: function(project, format) {
    
    var ret = '';
    var tasks = project.get('tasks');
    var len = tasks.get('length');
    
    ret += project.exportData(format);
    for (var i = 0; i < len; i++) {
      ret += tasks.objectAt(i).exportData(format);
    }
    ret += '\n';
    
    return ret;
    
  },
  
  /**
   * Export data for all projects.
   *
   * @param {String} format in which data is to be exported.
   * @returns {String) return a string with all Tasks data exported in it.
   */
  _exportAllData: function(format) {
    
    var ret = '';
    var that = this;
    
    // First export unallocated tasks
    Tasks.projectsController.forEach(function(project){
      var name = project.get('name');
      if(name === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
        var tasks = project.get('tasks');
        var len = tasks.get('length');
        if(len === 0 && name === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return; // skip empty UnallocatedTasks Project
        ret += that._exportProjectData(project, format);
      }
    }, Tasks.projectsController);
    
    // Next export allocated tasks
    Tasks.projectsController.forEach(function(project){
      var name = project.get('name');
      if(name === CoreTasks.ALL_TASKS_NAME.loc() || name === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return; // skip All and Unallocated Tasks Projects
      ret += that._exportProjectData(project, format);
    }, Tasks.projectsController);
    
    return ret;
    
  },

  /**
   * Export displayed tasks.
   *
   * @param {String} format in which data is to be exported.
   * @returns {String) return a string with displayed Tasks data exported in it.
   */
  _exportDisplayedData: function(format) {
    
    var ret = '';
    var tasksTree = Tasks.tasksController.get('content');
    var assignmentNodes = tasksTree.get('treeItemChildren');
    var assigneesCount = assignmentNodes.get('length');
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      var tasks = assignmentNode.get('treeItemChildren');
      var tasksCount = assignmentNode.get('tasksCount');
      if(format === 'HTML') ret += '<h3>';
      ret += '\n';
      ret += '# ' + assignmentNode.get('displayName').loc() + '; ' + "_Has".loc() + tasksCount + "_Tasks".loc() + '\n';
      if(format === 'HTML') ret += '</h3>\n';
      if(tasks) {
        for(var j=0; j < tasksCount; j++) {
          ret += tasks.objectAt(j).exportData(format);
        }
      }
    }
    
    return ret;
    
  },
  
  /**
   * Export data per Tasks file format.
   *
   * @param {String} format in which data is to be exported.
   */
  _exportData: function(format) {
    
    var sel = Tasks.projectsController.get('selection');
    if(!sel) return false;
    var selectedProject = sel.firstObject();
    if(!selectedProject) return false;
    
    var ret = '';
    if(format === 'HTML') ret += '<html>\n<body>\n';
    
    if(format === 'HTML') ret += '<p>\n';
    ret += "_TasksExportTimestamp".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy') + '\n';
    if(format === 'HTML') ret += '</p>';
    ret += '\n';
    
    var selectedProjectName = selectedProject.get('name');
    if (selectedProjectName === CoreTasks.ALL_TASKS_NAME.loc() && !Tasks.assignmentsController.hasFiltering()) {
      ret += this._exportAllData(format);
    }
    else {
      ret += selectedProject.exportData(format);
      ret += this._exportDisplayedData(format);
    }
    
    if(format === 'HTML') ret += '</body>\n</html>\n';
    this.set('data', ret);
    
    Tasks.exportDataController.openPanel();
    
  },
  
  _exportDataAsText: function() { this._exportData('Text'); },
  _exportDataAsHTML: function() { this._exportData('HTML'); },
  
  /**
  * Export Tasks data in one of the available formats.
  */
  selectExportDataFormat: function() {
    var pane = SC.MenuPane.create({
      layout: { width: 175, height: 0 },
      items: [
        { title: "_ExportText", icon: 'text-icon', isEnabled: YES, target: this, action: '_exportDataAsText' },
        { title: "_ExportHTML", icon: 'html-icon', isEnabled: YES, target: this, action: '_exportDataAsHTML' }
      ],
      localize: YES,
      itemIsEnabledKey: 'isEnabled',
      itemTitleKey: 'title',
      itemIconKey: 'icon',
      itemActionKey: 'action',
      preferType: SC.PICKER_MENU,
      contentView: SC.View.extend({})
    });
    pane.popup(Tasks.getPath('mainPage.mainPane.exportButton'));
  }
  

});
