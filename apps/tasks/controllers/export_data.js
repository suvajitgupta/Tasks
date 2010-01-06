// ==========================================================================
// Tasks.exportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

Tasks.EXPORT_HEADER = '<head>\n' +
'<title>' + "_Tasks".loc() + ' ' + "_Export".loc() + '</title>\n' +
'<script type="text/javascript">\n' +
'<!--\n' +
'var showDescriptions = false;\n' +
'function toggleDescriptions() {\n' +
' showDescriptions = !showDescriptions;\n' +
' document.body.className = showDescriptions? "showDescriptions" : "";\n' +
'}\n' +
'//-->\n' +
'</script>\n' +
'<style type="text/css">\n' +
'body pre { display:none }\n' +
'body.showDescriptions pre { display:block }\n' +
'body {\n' +
' font-family: "Lucida Sans","Lucida Grande",Verdana,Arial,sans-serif;\n' +
' font-style: normal;\n' +
' font-size: 11px;\n' +
'}\n' +
'h1, h2 {\n' +
' padding: 3px 6px;\n' +
' color: white;\n' +
' -moz-border-radius: 5px;\n' +
' -webkit-border-radius: 5px;\n' +
'}\n' +
'h1 {\n' +
' font-size: 14px;\n' +
' border: 1px solid black;\n' +
' background-color: black;\n' +
'}\n' +
'h2 {\n' +
' font-size: 11px;\n' +
' margin-left: 10px;\n' +
'}\n' +
'p {\n' +
' margin-top: -5px;\n' +
' margin-left: 25px;\n' +
' border-color: silver;\n' +
' border-width: 1px;\n' +
' border-bottom-style: dotted;\n' +
' padding-bottom: 2px;\n' +
'}\n' +
'pre {\n' +
' white-space: pre-wrap;\n' +
' word-wrap: break-word;\n' +
' margin-top: -10px;\n' +
' margin-left: 115px;\n' +
' background-color: beige;\n' +
'}\n' +
'.id, .type {\n' +
' display: inline-block;\n' +
' text-align: center;\n' +
' width: 32px;\n' +
' font-size: 9px;\n' +
' padding: 1px 4px;\n' +
'}\n' +
'.type {\n' +
' border: 1px solid gray;\n' +
' -moz-border-radius: 15px;\n' +
' -webkit-border-radius: 15px;\n' +
'}\n' +
'.untested {\n' +
' border: 1px solid gray;\n' +
' color: black;\n' +
' background-color: white;\n' +
'}\n' +
'.not-loaded {\n' +
' border: 1px solid dimGray;\n' +
' color: white;\n' +
' background-color: dimGray;\n' +
'}\n' +
'.properly-loaded {\n' +
' border: 1px solid blue;\n' +
' color: white;\n' +
' background-color: blue;\n' +
'}\n' +
'.passed, .under-loaded {\n' +
' border: 1px solid green;\n' +
' color: white;\n' +
' background-color: green;\n' +
'}\n' +
'.failed, .overloaded {\n' +
' border: 1px solid red;\n' +
' color: white;\n' +
' background-color: red;\n' +
'}\n' +
'.feature {\n' +
' color: black;\n' +
' background-color: yellow;\n' +
'}\n' +
'.bug {\n' +
' color: black;\n' +
' background-color: coral;\n' +
'}\n' +
'.other {\n' +
' color: black;\n' +
' background-color: silver;\n' +
'}\n' +
'.high {\n' +
' font-weight: bold;\n' +
'}\n' +
'.low {\n' +
' font-style: italic;\n' +
'}\n' +
'.active {\n' +
' color: blue;\n' +
'}\n' +
'.done {\n' +
' color: green;\n' +
'}\n' +
'.risky {\n' +
' color: red;\n' +
'}\n' +
'.time, .total {\n' +
' position: absolute;\n' +
' color: black;\n' +
' background-color: white;\n' +
' font-size: 10px;\n' +
' font-weight: normal;\n' +
' border: 1px solid gray;\n' +
' padding: 0px 7px;\n' +
' -moz-border-radius: 7px;\n' +
' -webkit-border-radius: 7px;\n' +
' opacity: 0.85;\n' +
'}\n' +
'.time {\n' +
' right: 10px;\n' +
'}\n' +
'.total {\n' +
' right: 125px;\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<center>\n' +
'<strong>PRIORITY:</strong> <span class="high">High</span>, <span class="medium">Medium</span>, <span class="low">Low</span>;\n' +
'&nbsp;&nbsp;&nbsp;<strong>STATUS:</strong> <span class="planned">Planned</span>, <span class="active">Active</span>, <span class="done">Done</span>, <span class="risky">Risky</span>;\n' +
'&nbsp;&nbsp;&nbsp;<strong>VALIDATION:</strong> <span class="untested">Untested</span>, <span class="passed">Passed</span>, <span class="failed">Failed</span>\n' +
'</center><hr>\n' +
'<input type=checkbox onclick="toggleDescriptions()"/>Show descriptions\n';


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
        ret += '<h2 class="';
        switch(assignmentNode.get('loading')) {
          case CoreTasks.USER_NOT_LOADED: ret += 'not-loaded'; break;
          case CoreTasks.USER_UNDER_LOADED: ret += 'under-loaded'; break;
          case CoreTasks.USER_PROPERLY_LOADED: ret += 'properly-loaded'; break;
          case CoreTasks.USER_OVER_LOADED: ret += 'overloaded'; break;
        }
        ret += '">';
      }
      else ret += '\n# ';
      ret += assignmentNode.get('displayName').loc();
      if(format === 'HTML') {
        var finishedEffort = assignmentNode.get('finishedEffort');
        if(finishedEffort) ret += '&nbsp;<span class="total">' + finishedEffort + '</span>';
        var displayEffort = assignmentNode.get('displayEffort');
        if(displayEffort) ret += '&nbsp;<span class="time">' + displayEffort + '</span>';
        ret += '</h2>';
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
    if(format === 'HTML') ret += '<html>\n' + Tasks.EXPORT_HEADER;
    
    if(format === 'HTML') ret += '<span class="time">';
    else ret += '# ' + "_Tasks".loc() + ' ' + "_Export".loc() + ' ';
    ret += new Date().format('hh:mm:ss a MMM dd, yyyy');
    if(format === 'HTML') ret += '</span>\n';
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
