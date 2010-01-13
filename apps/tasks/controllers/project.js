// ==========================================================================
// Tasks.projectController
// ==========================================================================
/*globals Tasks CoreTasks */

/** 

  This controller tracks the selected Project in the master list

  @extends SC.ObjectController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectController = SC.ObjectController.create(
/** @scope Tasks.projectController.prototype */ {
  
  contentBinding: 'Tasks.projectsController.selection',
  contentBindingDefault: SC.Binding.single(),
  
  projectStatistics: '',
  computeStatistics: function() {
    var ret = '';
    var project = this.get('content');
    if(project) {
      var tasks = project.get('tasks');
      var tasksCount = tasks.get('length');
      ret += "_Has".loc() + project.getPath('tasks.length') + "_tasks".loc();
      if(tasksCount > 0) {
        var featureCount = 0, bugCount = 0, otherCount = 0;
        var highCount = 0, mediumCount = 0, lowCount = 0;
        var plannedCount = 0, activeCount = 0, doneCount = 0, riskyCount = 0;
        var untestedCount = 0, passedCount = 0, failedCount = 0;
        for(var i=0; i<tasksCount; i++) {
          var task = tasks.objectAt(i);
          switch(task.get('type')) {
            case CoreTasks.TASK_TYPE_FEATURE: featureCount++; break;
            case CoreTasks.TASK_TYPE_BUG: bugCount++; break;
            case CoreTasks.TASK_TYPE_OTHER: otherCount++; break;
          }
          switch(task.get('priority')) {
            case CoreTasks.TASK_PRIORITY_HIGH: highCount++; break;
            case CoreTasks.TASK_PRIORITY_MEDIUM: mediumCount++; break;
            case CoreTasks.TASK_PRIORITY_LOW: lowCount++; break;
          }
          switch(task.get('developmentStatus')) {
            case CoreTasks.TASK_STATUS_PLANNED: plannedCount++; break;
            case CoreTasks.TASK_STATUS_ACTIVE: activeCount++; break;
            case CoreTasks.TASK_STATUS_DONE: doneCount++; break;
            case CoreTasks.TASK_STATUS_RISKY: riskyCount++; break;
          }
          switch(task.get('validation')) {
            case CoreTasks.TASK_VALIDATION_UNTESTED: untestedCount++; break;
            case CoreTasks.TASK_VALIDATION_PASSED: passedCount++; break;
            case CoreTasks.TASK_VALIDATION_FAILED: failedCount++; break;
          }
        }
        ret += ('\n' + "_Type".loc() + ' - ');
        ret += ("_Feature".loc() + ': ' + featureCount + ' (' + Math.round(100*featureCount/tasksCount) + '%)');
        ret += (', ' + "_Bug".loc() + ': ' + bugCount + ' (' + Math.round(100*bugCount/tasksCount) + '%)');
        ret += (', ' + "_Other".loc() + ': ' + otherCount + ' (' + Math.round(100*otherCount/tasksCount) + '%)');
        ret += ('\n' + "_Priority".loc() + ' - ');
        ret += ("_High".loc() + ': ' + highCount + ' (' + Math.round(100*highCount/tasksCount) + '%)');
        ret += (', ' + "_Medium".loc() + ': ' + mediumCount + ' (' + Math.round(100*mediumCount/tasksCount) + '%)');
        ret += (', ' + "_Low".loc() + ': ' + lowCount + ' (' + Math.round(100*lowCount/tasksCount) + '%)');
        ret += ('\n' + "_Status".loc() + ' - ');
        ret += ("_Planned".loc() + ': ' + plannedCount + ' (' + Math.round(100*plannedCount/tasksCount) + '%)');
        ret += (', ' + "_Active".loc() + ': ' + activeCount + ' (' + Math.round(100*activeCount/tasksCount) + '%)');
        ret += (', ' + "_Done".loc() + ': ' + doneCount + ' (' + Math.round(100*doneCount/tasksCount) + '%)');
        ret += (', ' + "_Risky".loc() + ': ' + riskyCount + ' (' + Math.round(100*riskyCount/tasksCount) + '%)');
        ret += ('\n' + "_Validation".loc() + ' - ');
        ret += ("_Untested".loc() + ': ' + untestedCount + ' (' + Math.round(100*untestedCount/tasksCount) + '%)');
        ret += (', ' + "_Passed".loc() + ': ' + passedCount + ' (' + Math.round(100*passedCount/tasksCount) + '%)');
        ret += (', ' + "_Failed".loc() + ': ' + failedCount + ' (' + Math.round(100*failedCount/tasksCount) + '%)');
      }
    }
    this.set('projectStatistics', ret);
  },
  
  showStatistics: function() {
    this.computeStatistics();
    var panel = Tasks.getPath('statisticsPane');
    if(panel) panel.append();
  },
  
  closePanel: function() {
    var panel = Tasks.getPath('statisticsPane');
    if(panel) {
      panel.remove();
      panel.destroy();
    }
    this.set('projectStatistics', '');
  },
  
  projectName: function() {
    return "_Project:".loc() + this.getPath('content.name');
  }.property('content').cacheable(),

  _contentDidChange: function() { // when a new project is selected
    var last = this._project,
        cur = this.get('content');
    
    if (cur && cur.firstObject) cur = cur.firstObject();
    if (last !== cur) {
      // console.log('Switching to project: ' + cur.get('name'));
      Tasks.deselectTasks();
      this._project = cur;
      SC.routes.set('location', '#project&name=' + cur.get('name'));
    }
  }.observes('content')
  
});
