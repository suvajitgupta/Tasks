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
' line-height: 13px;\n' +
' margin-top: 4px;\n' +
' margin-bottom: 4px;\n' +
' padding: 3px 6px;\n' +
' color: white;\n' +
' opacity: 0.85;\n' +
' -moz-border-radius: 5px;\n' +
' -webkit-border-radius: 5px;\n' +
'}\n' +
'h1 {\n' +
' font-size: 14px;\n' +
' background-color: black;\n' +
' border: 1px solid black;\n' +
'}\n' +
'h2 {\n' +
' font-size: 11px;\n' +
' margin-left: 10px;\n' +
'}\n' +
'p {\n' +
' line-height: 12px;\n' +
' margin-top: 4px;\n' +
' margin-bottom: 4px;\n' +
' margin-left: 25px;\n' +
' border-color: silver;\n' +
' border-width: 1px;\n' +
' border-bottom-style: dotted;\n' +
' padding-bottom: 2px;\n' +
'}\n' +
'pre {\n' +
' margin-top: -5px;\n' +
' margin-bottom: 8px;\n' +
' margin-left: ' + (Tasks.softwareMode? '115' : '70') + 'px;\n' +
' background-color: beige;\n' +
' white-space: pre-wrap;\n' +
' word-wrap: break-word;\n' +
' border: 1px solid silver;\n' +
' padding: 5px;\n' +
'}\n' +
'.id {\n' +
' line-height: 1.5;\n' +
' width: 32px !important;\n' +
' letter-spacing: -1px;\n' +
'}\n' +
'.untested, .passed, .failed, .feature, .bug, .other {\n' +
' width: 44px;\n' +
' display: inline-block;\n' +
' text-align: center;\n' +
' font-size: 9px;\n' +
'}\n' +
'.feature, .bug, .other {\n' +
(Tasks.softwareMode? '' : ' display: none;\n') +
' padding: 1px 0px;\n' +
' border: 1px solid gray;\n' +
' -moz-border-radius: 15px;\n' +
' -webkit-border-radius: 15px;\n' +
'}\n' +
'.untested, .passed, .failed {\n' +
' padding: 1px 3px;\n' +
'}\n' +
'.untested {\n' +
' color: black;\n' +
' background-color: white;\n' +
' border: 1px solid gray;\n' +
'}\n' +
'.not-loaded {\n' +
' color: white;\n' +
' background-color: #444;\n' +
' border: 1px solid #444;\n' +
'}\n' +
'.properly-loaded {\n' +
' color: white;\n' +
' background-color: #36F;\n' +
' border: 1px solid #36F;\n' +
'}\n' +
'.passed, .under-loaded {\n' +
' color: white;\n' +
' background-color: #363;\n' +
' border: 1px solid #363;\n' +
' opacity: 0.85;\n' +
'}\n' +
'.failed, .overloaded {\n' +
' color: white;\n' +
' background-color: #C33;\n' +
' border: 1px solid #C33;\n' +
' opacity: 0.85;\n' +
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
'.effort, .time, .total {\n' +
' position: absolute;\n' +
' height: 12px;\n' +
' line-height: 11px;\n' +
' font-size: 11px;\n' +
' padding: 1px 5px;\n' +
' letter-spacing: -1px !important;\n' +
' -moz-border-radius: 7px;\n' +
' -webkit-border-radius: 7px;\n' +
'}\n' +
'.effort {\n' +
' color: white;\n' +
' background-color: #97A8C7;\n' +
'}\n' +
'.time, .total {\n' +
' color: black;\n' +
' background-color: white;\n' +
' opacity: 0.85;\n' +
'}\n' +
'.effort, .time {\n' +
' right: 10px;\n' +
'}\n' +
'.total {\n' +
' right: 175px;\n' +
'}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<center>\n' +
'<strong>PRIORITY:</strong> <span class="high">High</span> <span class="medium">Medium</span> <span class="low">Low</span>\n' +
'&nbsp;&nbsp;&nbsp;<strong>STATUS:</strong> <span class="planned">Planned</span> <span class="active">Active</span> <span class="done">Done</span> <span class="risky">Risky</span>\n' +
'&nbsp;&nbsp;&nbsp;<strong>VALIDATION:</strong> <span class="untested">Untested</span> <span class="passed">Passed</span> <span class="failed">Failed</span>\n' +
'</center><hr>\n' +
'<input type=checkbox onclick="toggleDescriptions()"/>Show Descriptions\n';


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
      if(project === CoreTasks.get('unallocatedTasksProject')) {
        var tasks = project.get('tasks');
        var len = tasks.get('length');
        if(len === 0) return; // skip empty UnallocatedTasks Project
        ret += that._exportProjectData(project, format);
      }
    }, Tasks.projectsController);
    
    // Next export allocated tasks
    Tasks.projectsController.forEach(function(project){
      if(CoreTasks.isSystemProject(project)) return; // skip All and Unallocated Tasks Projects
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
    
    var projectsToExport = [];
    var sel = Tasks.projectsController.get('selection');
    var len = sel? sel.get('length') : 0;
    var i, context = {}, project;
    if(len > 0) {
      for (i = 0; i < len; i++) {
        project = sel.nextObject(i, null, context);
        if(project === CoreTasks.get('allTasksProject')) {
          projectsToExport = [];
          break;
        }
        projectsToExport.push(project);
      }
    }
    if(projectsToExport.get('length') === 0) {
      projectsToExport.push(CoreTasks.get('allTasksProject'));
    }
    
    var ret = '';
    if(format === 'HTML') ret += '<html>\n' + Tasks.EXPORT_HEADER;
    
    if(format === 'HTML') ret += '<span class="time">';
    else ret += '# ' + "_Tasks".loc() + ' ' + "_Export".loc() + ' ';
    ret += new Date().format('hh:mm:ss a MMM dd, yyyy');
    if(format === 'HTML') ret += '</span>\n';
    else ret += '\n';
    ret += '\n';
    
    if (projectsToExport[0] === CoreTasks.get('allTasksProject') && !Tasks.assignmentsController.hasFiltering()) {
      ret += this._exportAllData(format);
    }
    else {
      if(len === 1) {
        ret += project.exportData(format);
      }
      else { // multiple projects selected
        if(format === 'HTML') ret += '<h1>\n';
        for (i = 0; i < len; i++) {
          project = sel.nextObject(i, null, context);
          if(format === 'Text') ret += '# ';
          ret += project.get('name');
          if(format === 'HTML') ret += '<br>';
          ret += '\n';
        }
        if(format === 'HTML') ret += '</h1>\n';
      }
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
