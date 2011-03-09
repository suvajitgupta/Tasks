// ==========================================================================
// Tasks.exportDataController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

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
'body pre { display: none }\n' +
'body.showDescriptions pre { display: block }\n' +
'body {\n' +
' font-family: "Lucida Sans","Lucida Grande",Verdana,Arial,sans-serif;\n' +
' font-style: normal;\n' +
' font-size: 11px;\n' +
'}\n' +
'.title-bar {\n' +
' background-color: #333;\n' +
' color: #DDD;\n' +
' font-size: 14px;\n' +
' font-weight: bold;\n' +
' line-height: 44px;\n' +
'}\n' +
'.legend {\n' +
' position: absolute;\n' +
' margin-top: -5px;\n' +
' line-height: 1.5;\n' +
'}\n' +
'.description {\n' +
' position: absolute;\n' +
' margin-top: -5px;\n' +
' right: 10px;\n' +
'}\n' +
'h1, h2 {\n' +
' line-height: 17px;\n' +
' margin-top: 14px;\n' +
' margin-bottom: 5px;\n' +
' padding: 3px 6px;\n' +
'}\n' +
'h1 {\n' +
' font-size: 20px;\n' +
' background-color: #CCC;\n' +
' border: 1px solid #AAA;\n' +
'}\n' +
'h2 {\n' +
' font-size: 14px;\n' +
' color: #222;\n' +
' padding-left: 10px;\n' +
' border: 1px solid #777;\n' +
'}\n' +
'h2, p {\n' +
' margin-left: 15px;\n' +
'}\n' +
'p {\n' +
' background-color: #EEE;\n' +
' line-height: 23px;\n' +
' margin-top: -5px;\n' +
' margin-bottom: 4px;\n' +
' border: 1px solid #CCC;\n' +
' padding: 0px;\n' +
'}\n' +
'pre, .description {\n' +
' background-color: beige;\n' +
' outline: 1px solid silver;\n' +
'}\n' +
'pre {\n' +
' margin-top: -4px;\n' +
' margin-bottom: 5px;\n' +
' margin-left: 16px;\n' +
' margin-right: 1px;\n' +
' white-space: pre-wrap;\n' +
' word-wrap: break-word;\n' +
' padding: 5px ' + (SC.browser.msie? '60' : '68') + 'px;\n' +
'}\n' +
'.assignee {\n' +
' border-bottom: 2px solid #555;\n' +
'}\n' +
'.assignee-not-loaded {\n' +
' background-color: #AAA;\n' +
' -moz-box-shadow: inset 0px 2px 2px #DDD;\n' +
' -webkit-box-shadow: inset 0px 2px 2px #DDD;\n' +
'}\n' +
'.assignee-under-loaded {\n' +
' background-color: #0C0;\n' +
' -moz-box-shadow: inset 0px 2px 2px #9F9;\n' +
' -webkit-box-shadow: inset 0px 2px 2px #9F9;\n' +
'}\n' +
'.assignee-properly-loaded {\n' +
' background-color: #69F;\n' +
' -moz-box-shadow: inset 0px 2px 2px #9FF;\n' +
' -webkit-box-shadow: inset 0px 2px 2px #9FF;\n' +
'}\n' +
'.assignee-overloaded {\n' +
' background-color: #F66;\n' +
' -moz-box-shadow: inset 0px 2px 2px #FAA;\n' +
' -webkit-box-shadow: inset 0px 2px 2px #FAA;\n' +
'}\n' +
'.margin {\n' +
' border-right: 3px solid #FCC;\n' +
' padding: 0px 3px 0px 0px;\n' +
'}\n' +
'.id {\n' +
' margin-left: 5px;\n' +
' line-height: 1.5;\n' +
' width: 40px !important;\n' +
' text-align: center;\n' +
' letter-spacing: -1px;\n' +
' font-size: 9px;\n' +
'}\n' +
'.feature, .bug, .other {\n' +
' width: 12px;\n' +
(Tasks.softwareMode? '' : ' display: none !important;\n') +
' padding: 1px 0px;\n' +
' margin: 0px 1px;\n' +
' border: 1px solid #AAA;\n' +
' line-height: 10px;\n' +
' -moz-border-radius: 15px;\n' +
' -webkit-border-radius: 15px;\n' +
'}\n' +
'.feature {\n' +
' color: black;\n' +
' background-color: #EFC62A;\n' +
'}\n' +
'.bug {\n' +
' color: black;\n' +
' background-color: #9E1D14;\n' +
'}\n' +
'.other {\n' +
' color: black;\n' +
' background-color: #C7C7C7;\n' +
'}\n' +
'.margin, .name, .feature, .bug, .other, .untested, .passed, .failed {\n' +
' display: inline-block;\n' +
'}\n' +
'.high {\n' +
' font-weight: bold;\n' +
'}\n' +
'.low {\n' +
' font-style: italic;\n' +
'}\n' +
'.planned {\n' +
' color: black;\n' +
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
'.untested, .passed, .failed {\n' +
' color: black;\n' +
' padding: 1px 3px;\n' +
' -moz-border-radius: 3px;\n' +
' -webkit-border-radius: 3px;\n' +
'}\n' +
'.passed {\n' +
' background-color: #0C0;\n' +
'}\n' +
'.failed {\n' +
' background-color: #F66;\n' +
'}\n' +
'.effort, .time, .total {\n' +
' position: absolute;\n' +
' height: 12px;\n' +
' line-height: 12px;\n' +
' margin-top: 3px;\n' +
' font-size: 11px;\n' +
' font-weight: normal;\n' +
' padding: 1px 5px;\n' +
' letter-spacing: -1px !important;\n' +
' border: 1px solid #888 !important;\n' +
' -moz-border-radius: 7px;\n' +
' -webkit-border-radius: 7px;\n' +
'}\n' +
'.effort {\n' +
' color: white;\n' +
' background-color: #888;\n' +
'}\n' +
'.time, .total {\n' +
' color: #555;\n' +
' margin-top: 1px;\n' +
' background-color: #EEE;\n' +
'}\n' +
'.effort, .time {\n' +
' right: 15px;\n' +
'}\n' +
'.total {\n' +
' right: 225px;\n' +
'}\n' +
'.doneEffortRangeWarning, .incompleteEffortWarning {\n' +
' background-color: #FC0 !important;\n' +
' color: #555 !important;\n' +
'}\n' +
'</style>\n' +
'</head>\n';

Tasks.EXPORT_LEGEND = '<br><span class="legend">\n' +
(Tasks.softwareMode? '<strong>TYPE:</strong> <span class="feature">&nbsp;</span> Feature <span class="bug">&nbsp;</span> Bug <span class="other">&nbsp;</span> Other\n&nbsp;&nbsp;&nbsp;' : '') +
'<strong>PRIORITY:</strong> <span class="high">High</span> <span class="medium">Medium</span> <span class="low">Low</span>\n' +
'&nbsp;&nbsp;&nbsp;<strong>STATUS:</strong> <span class="planned">Planned</span> <span class="active">Active</span> <span class="done">Done</span> <span class="risky">Risky</span>\n' +
'&nbsp;&nbsp;&nbsp;<strong>VALIDATION:</strong> <span class="untested">Untested</span> <span class="passed">Passed</span> <span class="failed">Failed</span></span>\n' +
'<span class="description"><input type=checkbox onclick="toggleDescriptions()"/>&nbsp;Description&nbsp;</span>\n<br><hr>\n';


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
  _showExportedData: function(format) {
    if(format === 'HTML') {
      var win = window.open();
      if(win) {
        win.document.write(this.data);
    		win.document.close();
      }
    }
    else {
      Tasks.get('exportDataPane').append();
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
    
    // First export users
    if(format === 'Text') {
      ret += '#================================================================================\n';
      ret += '# ' + "_Has".loc() + Tasks.usersController.getPath('content.length') + "_users".loc() + '\n';
      ret += '#================================================================================\n\n';
    }
    else {
      ret += '<h1>' + "_Has".loc() + Tasks.usersController.getPath('content.length') + "_users".loc() + '</h1>\n';
    }
    Tasks.usersController.forEach(function(user){
      ret += user.exportData(format);
    }, Tasks.usersController);
    ret += '\n\n';
    
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
      if(CoreTasks.isSystemProject(project)) return; // skip system projects
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
    
    var ret = '', incompleteEffortWarning;
    var tasksTree = Tasks.tasksController.get('content');
    var assignmentNodes = tasksTree.get('treeItemChildren');
    var assigneesCount = assignmentNodes.get('length');
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      var tasks = assignmentNode.get('treeItemChildren');
      var tasksCount = assignmentNode.get('tasksCount');
      if(format === 'HTML') {
        ret += '<h2 class="assignee ';
        switch(assignmentNode.get('loading')) {
          case CoreTasks.USER_NOT_LOADED: ret += 'assignee-not-loaded'; break;
          case CoreTasks.USER_UNDER_LOADED: ret += 'assignee-under-loaded'; break;
          case CoreTasks.USER_PROPERLY_LOADED: ret += 'assignee-properly-loaded'; break;
          case CoreTasks.USER_OVER_LOADED: ret += 'assignee-overloaded'; break;
        }
        ret += '">';
      }
      else ret += '\n# ';
      ret += assignmentNode.get('displayName').loc();
      if(format === 'HTML') {
        var finishedEffort = assignmentNode.get('finishedEffort');
        if(finishedEffort) ret += '&nbsp;<span class="total">' + finishedEffort + '</span>';
        var leftEffort = assignmentNode.get('displayEffort');
        incompleteEffortWarning = (leftEffort.match(/\?$/) !== null);
        if(leftEffort) ret += '&nbsp;<span class="time' + (incompleteEffortWarning? ' incompleteEffortWarning' : '') + '">' + leftEffort + '</span>';
        ret += '</h2>';
      }
      else ret += ' # ' + "_Has".loc() + tasksCount + "_tasks".loc();
      ret += '\n';
      if(format === 'Text') ret += '#--------------------------------------------------------------------------------\n';
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
  exportData: function(format) {
    
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
    if(format === 'HTML') ret += '<html>\n' + Tasks.EXPORT_HEADER + '\n<body>\n<center class="title-bar">';
    else ret += '# ';
    ret += "_Tasks".loc() + ' ' + "_Export".loc() + "_at".loc() + SC.DateTime.create().toFormattedString(CoreTasks.TIME_DATE_FORMAT) + ' # ' + "_Has".loc() +
           Tasks.getPath('assignmentsController.assignmentsSummary');
    if(format === 'HTML') ret += '</center>\n' + Tasks.EXPORT_LEGEND;
    ret += '\n\n';
    
    if (projectsToExport[0] === CoreTasks.get('allTasksProject') && Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TASKS &&
       !Tasks.filterSearchController.isFilterOrSearchEnabled()) {
      ret += this._exportAllData(format);
    }
    else {
      if(len === 1) {
        ret += project.exportData(format);
      }
      else { // multiple projects selected
        if(format === 'Text') ret += '#================================================================================\n';
        else ret += '<h1>\n';
        for (i = 0; i < len; i++) {
          project = sel.nextObject(i, null, context);
          if(format === 'Text') ret += '# ';
          else ret += '<span class="' + project.get('developmentStatus').loc().toLowerCase() + '">';
          ret += project.get('name');
          if(format === 'HTML') ret += '<br>';
          ret += '\n';
        }
        if(format === 'Text') ret += '#================================================================================\n\n';
        else ret += '</h1>\n\n';
        
      }
      ret += this._exportDisplayedData(format);
    }
    
    if(format === 'HTML') ret += '</body>\n</html>\n';
    this.set('data', ret);
    
    Tasks.exportDataController._showExportedData(format);
    
  }
  
});
