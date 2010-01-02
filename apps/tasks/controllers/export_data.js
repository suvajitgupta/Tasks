// ==========================================================================
// Tasks.exportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

Tasks.HEADER_STYLE = '<head>\n' +
'<title>' + "_Tasks".loc() + ' ' + "_Export".loc() + '</title>\n' +
'<style type="text/css">\n' +
'body {\n' +
'	font-family: "Lucida Sans","Lucida Grande",Verdana,Arial,sans-serif;\n' +
'	font-style: normal;\n' +
'}\n' +
'h2, h3 {\n' +
'	padding: 4px 6px 4px 6px;\n' +
'	color: white;\n' +
' -moz-border-radius: 5px;\n' +
' -webkit-border-radius: 5px;\n' +
'}\n' +
'h2 {\n' +
'	font-size: 14px;\n' +
'	background-color: black;\n' +
'}\n' +
'h3 {\n' +
'	font-size: 11px;\n' +
'	margin-left: 10px;\n' +
'}\n' +
'p, pre {\n' +
'	font-size: 11px;\n' +
'	margin-top: -2px;\n' +
'	margin-left: 25px;\n' +
'}\n' +
'.prefix {\n' +
'	display: inline-block;\n' +
'	text-align: center;\n' +
'	width: 32px;\n' +
'	font-size: 9px;\n' +
'	padding: 1px 5px 1px 5px;\n' +
'}\n' +
'.postfix {\n' +
'	color: black;\n' +
'	background-color: white;\n' +
'	font-size: 10px;\n' +
' font-weight: normal;\n' +
'	border: 1px solid gray;\n' +
'	padding: 0px 7px 0px 7px;\n' +
' -moz-border-radius: 7px;\n' +
' -webkit-border-radius: 7px;\n' +
' opacity: 0.85;\n' +
'}\n' +
'</style>\n' +
'</head>\n';


/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller exporting data.
*/
Tasks.exportDataController = SC.ObjectController.create(
/** @scope Tasks.exportDataController.prototype */ {

  data: '',
  
  /**
   * Show exported data in a popup panel or new window - based on format.
   *
   * @param {String} format in which data was exported.
   */
  showExportedData: function(format) {
    if(format === 'HTML') {
      var win = window.open();
      if(win) {
        win.document.write(this.data);
    		win.document.close();
      }
    }
    else {
      var panel = Tasks.getPath('exportDataPage.panel');
      if(panel) panel.append();
    }
  },

  closePanel: function() {
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
      if(format === 'HTML') {
        ret += '<h3 style="background-color:';
        switch(assignmentNode.get('loading')) {
          case CoreTasks.USER_NOT_LOADED: ret += 'gray'; break;
          case CoreTasks.USER_UNDER_LOADED: ret += 'green'; break;
          case CoreTasks.USER_PROPERLY_LOADED: ret += 'blue'; break;
          case CoreTasks.USER_OVER_LOADED: ret += 'red'; break;
        }
        ret += ';">';
      }
      else ret += '\n# ';
      ret += assignmentNode.get('displayName').loc();
      if(format === 'HTML') {
        var finishedEffort = assignmentNode.get('finishedEffort');
        if(finishedEffort) ret += '&nbsp;<span class="postfix">' + finishedEffort + '</span>';
        var displayEffort = assignmentNode.get('displayEffort');
        if(displayEffort) ret += '&nbsp;<span class="postfix">' + displayEffort + '</span>';
        ret += '</h3>';
      }
      else ret += ' # ' + "_Has".loc() + tasksCount + "_tasks".loc();
      ret += '\n';
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
    if(format === 'HTML') ret += '<html>\n' + Tasks.HEADER_STYLE + '<body>\n';
    
    if(format === 'HTML') ret += '<p>';
    else ret += '# ';
    ret += "_TasksExportTimestamp".loc() + new Date().format('hh:mm:ss a MMM dd, yyyy');
    if(format === 'HTML') ret += '</p>';
    else ret += '\n';
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
    
    Tasks.exportDataController.showExportedData(format);
    
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
