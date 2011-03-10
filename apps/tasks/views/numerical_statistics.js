// ==========================================================================
// Tasks.numericalStatisticsView
// ==========================================================================
/*globals Tasks sc_static */

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Shows statistics numerically
  
*/
Tasks.numericalStatisticsView = SC.View.create({
  
  layout: { top: 20, left: 0, right: 0, bottom: 0 },
  childViews: 'numericalStatistics'.w(),
  
  statisticsBinding: SC.Binding.oneWay('Tasks.statisticsController.statistics'),
  displayProperties: ['statistics'],
  
  numericalStatistics: SC.LabelView.design({
    textAlign: SC.ALIGN_CENTER,
    controlSize: SC.SMALL_CONTROL_SIZE,
    escapeHTML: NO
  }),
  
  render: function(context, firstTime) {
    var stats = this.get('statistics');
    var ret = '';
    if(stats && stats.tasksCount > 0) {
      if(Tasks.assignmentsController.get('displayMode') === Tasks.DISPLAY_MODE_TASKS) {

        var blank = sc_static('blank');
        this.set('statisticsData', [ stats.otherCount, stats.bugCount, stats.featureCount ]);
        this.set('statisticsLabels', [ "_Other".loc(), "_Bug".loc(), "_Feature".loc() ]);

        ret += '<table width="100%">';
        ret += '<tr class="even">';
        ret += ('<td class="title"><span>' + "_Priority".loc() + '</td>');
        ret += ('<td><span class="task-priority-high">' + "_High".loc() + ':</span> ' + stats.highCount + ' (' + Math.round(100*stats.highCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-priority-medium">' + "_Medium".loc() + ':</span> ' + stats.mediumCount + ' (' + Math.round(100*stats.mediumCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="task-priority-low">' + "_Low".loc() + ':</span> ' + stats.lowCount + ' (' + Math.round(100*stats.lowCount/stats.tasksCount) + '%)' + '</td>');
        ret += '<td></td></tr>';
        ret += '<tr class="odd">';
        if(Tasks.softwareMode) {
          ret += ('<td class="title"><span>' + "_Type".loc() + '</td>');
          ret += ('<td><img src="' + blank + '" class="task-icon-feature"/>&nbsp;' + "_Feature".loc() + ': ' + stats.featureCount + ' (' + Math.round(100*stats.featureCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><img src="' + blank + '" class="task-icon-bug"/>&nbsp;' + "_Bug".loc() + ': ' + stats.bugCount + ' (' + Math.round(100*stats.bugCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><img src="' + blank + '" class="task-icon-other"/>&nbsp;'  + "_Other".loc() + ': ' + stats.otherCount + ' (' + Math.round(100*stats.otherCount/stats.tasksCount) + '%)' + '</td>');
          ret += '<td></td></tr>';
          ret += '<tr class="even">';
        }
        ret += ('<td class="title"><span>' + "_Status".loc() + '</td>');
        ret += ('<td><span class="status-planned">' + "_Planned".loc() + ':</span> ' + stats.plannedCount + ' (' + Math.round(100*stats.plannedCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="status-active">' + "_Active".loc() + ':</span> ' + stats.activeCount + ' (' + Math.round(100*stats.activeCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="status-done">' + "_Done".loc() + ':</span> ' + stats.doneCount + ' (' + Math.round(100*stats.doneCount/stats.tasksCount) + '%)' + '</td>');
        ret += ('<td><span class="status-risky">' + "_Risky".loc() + ':</span> ' + stats.riskyCount + ' (' + Math.round(100*stats.riskyCount/stats.tasksCount) + '%)' + '</td>');
        ret += '</tr>';
        if(Tasks.softwareMode) {
          ret += '<tr class="odd">';
          ret += ('<td class="title"><span>' + "_Validation".loc() + '</td>');
          ret += ('<td><span class="task-validation-untested">' + "_Untested".loc() + ':</span> ' + stats.untestedCount + ' (' + Math.round(100*stats.untestedCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><span class="task-validation-passed">' + "_Passed".loc() + ':</span> ' + stats.passedCount + ' (' + Math.round(100*stats.passedCount/stats.tasksCount) + '%)' + '</td>');
          ret += ('<td><span class="task-validation-failed">' + "_Failed".loc() + ':</span> ' + stats.failedCount + ' (' + Math.round(100*stats.failedCount/stats.tasksCount) + '%)' + '</td>');
          ret += '<td></td></tr>';
        }
        ret += '</table>';
        ret += "_Submitters:".loc() + stats.submittersCount;
      }
      else { // displayMode === Tasks.DISPLAY_MODE_TEAM

        this.set('statisticsData', [ stats.notLoadedAssigneesCount, stats.underloadedAssigneesCount, stats.properlyLoadedAssigneesCount, stats.overloadedAssigneesCount ]);
        this.set('statisticsLabels', [ "_AssigneeNotLoaded".loc(), "_AssigneeUnderLoaded".loc(), "_AssigneeProperlyLoaded".loc(), "_AssigneeOverloaded".loc() ]);

        ret += '<table width="100%">';
        ret += '<tr class="even">';
        ret += ('<td class="title"><img src="' + blank + '" class="sc-icon-group-16"/>&nbsp;<span>' + "_Assignees:".loc() + '</td>');
        ret += ('<td><span class="assignee-not-loaded">' + "_AssigneeNotLoaded".loc() + ':</span> ' + stats.notLoadedAssigneesCount + '</td>');
        ret += ('<td><span class="assignee-under-loaded">' + "_AssigneeUnderLoaded".loc() + ':</span> ' + stats.underloadedAssigneesCount + '</td>');
        ret += ('<td><span class="assignee-properly-loaded">' + "_AssigneeProperlyLoaded".loc() + ':</span> ' + stats.properlyLoadedAssigneesCount + '</td>');
        ret += ('<td><span class="assignee-overloaded">' + "_AssigneeOverloaded".loc() + ':</span> ' + stats.overloadedAssigneesCount + '</td>');
        ret += '</tr>';
        ret += '<tr class="odd">';
        ret += ('<td class="title"><img src="' + blank + '" class="red-flag-icon"/>&nbsp;<span>' + "_RedFlags:".loc() + '</td>');
        ret += ('<td><span class="status-risky">' + "_Risky".loc() + ':</span> ' + stats.riskyTasksCount + '</td>');
        ret += ('<td><span class="task-validation-failed">' + "_Failed".loc() + ':</span> ' + stats.failedTasksCount + '</td>');
        ret += '<td></td><td></td></tr>';
        ret += '</table>';
        ret += "_TasksSummary:".loc() + stats.finishedTasksCount + ' ' + "_finished".loc() + ', ' + stats.leftTasksCount + ' ' + "_left".loc();
      }
    }
    this.setPath('numericalStatistics.value', ret);
    sc_super();
  }
    
});
