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
      var stats = project.statistics();
      var tasksCount = stats.tasksCount;
      ret += "_Has".loc() + tasksCount + "_tasks".loc() + '<br>';
      if(tasksCount > 0) {
        ret += '<table width="100%"><tr class="even">';
        ret += ('<td><span class="task-attribute-set-title">' + "_Type".loc() + '</td>');
        ret += ('<td>' + "_Feature".loc() + ': ' + stats.featureCount + ' (' + Math.round(100*stats.featureCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td>' + "_Bug".loc() + ': ' + stats.bugCount + ' (' + Math.round(100*stats.bugCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td>' + "_Other".loc() + ': ' + stats.otherCount + ' (' + Math.round(100*stats.otherCount/stats.tasksCount) + '%)' + '</td>');
        ret += '<td></td></tr><tr class="odd">';
        ret += ('<td><span class="task-attribute-set-title">' + "_Priority".loc() + '</td>');
        ret += ('<td><span class="task-priority-high">' + "_High".loc() + ':</span> ' + stats.highCount + ' (' + Math.round(100*stats.highCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-priority-medium">' + "_Medium".loc() + ':</span> ' + stats.mediumCount + ' (' + Math.round(100*stats.mediumCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-priority-low">' + "_Low".loc() + ':</span> ' + stats.lowCount + ' (' + Math.round(100*stats.lowCount/stats.tasksCount) + '%)' + '</td>');
        ret += '<td></td></tr><tr class="even">';
        ret += ('<td><span class="task-attribute-set-title">' + "_Status".loc() + '</td>');
        ret += ('<td><span class="task-status-planned">' + "_Planned".loc() + ':</span> ' + stats.plannedCount + ' (' + Math.round(100*stats.plannedCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-status-active">' + "_Active".loc() + ':</span> ' + stats.activeCount + ' (' + Math.round(100*stats.activeCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-status-done">' + "_Done".loc() + ':</span> ' + stats.doneCount + ' (' + Math.round(100*stats.doneCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-status-risky">' + "_Risky".loc() + ':</span> ' + stats.riskyCount + ' (' + Math.round(100*stats.riskyCount/stats.tasksCount) + '%)' + '</td>');
        ret += '</tr><tr class="odd">';
        ret += ('<td><span class="task-attribute-set-title">' + "_Validation".loc() + '</td>');
        ret += ('<td><span class="task-validation-untested">' + "_Untested".loc() + ':</span> ' + stats.untestedCount + ' (' + Math.round(100*stats.untestedCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-validation-passed">' + "_Passed".loc() + ':</span> ' + stats.passedCount + ' (' + Math.round(100*stats.passedCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-validation-failed">' + "_Failed".loc() + ':</span> ' + stats.failedCount + ' (' + Math.round(100*stats.failedCount/stats.tasksCount) + '%)' + '</td>');
        ret += '<td></td></tr></table>';
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
  
  _contentDidChange: function() { // when a new project is selected
    var last = this._project,
        cur = this.get('content');
    
    if (cur && cur.firstObject) cur = cur.firstObject();
    if (last !== cur) {
      // console.log('Switching to project: ' + cur.get('name'));
      Tasks.deselectTasks();
      if(cur) {
        this._project = cur;
        SC.routes.set('location', '#project&name=' + cur.get('name'));
      }
    }
  }.observes('content')
  
});
