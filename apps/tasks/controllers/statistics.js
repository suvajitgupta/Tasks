// ==========================================================================
// Tasks.statisticsController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

sc_require('core');

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for computing statistics.
*/
Tasks.statisticsController = SC.ObjectController.create(
/** @scope Tasks.loginController.prototype */ {

  statistics: '', // Stores statistics computed by function below
  computeStatistics: function() {

    var submitters = {};
    var notLoadedAssigneesCount = 0, underloadedAssigneesCount = 0,
        properlyLoadedAssigneesCount = 0, overloadedAssigneesCount = 0;
    var finishedTasksCount = 0, leftTasksCount = 0;
    var riskyTasksCount = 0, failedTasksCount = 0;
    var featureCount = 0, bugCount = 0, otherCount = 0;
    var highCount = 0, mediumCount = 0, lowCount = 0;
    var plannedCount = 0, activeCount = 0, doneCount = 0, riskyCount = 0;
    var untestedCount = 0, passedCount = 0, failedCount = 0;
    
    var assigneesCount = 0;
    var assignmentNodes = Tasks.assignmentsController.getPath('assignedTasks.treeItemChildren');
    if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
    var tasksCount, totalTasksCount = 0;
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      finishedTasksCount += assignmentNode.get('finishedTasksCount');
      leftTasksCount += assignmentNode.get('leftTasksCount');
      var loading = assignmentNode.get('loading');
      switch(loading) {
        case CoreTasks.USER_NOT_LOADED: notLoadedAssigneesCount++; break;
        case CoreTasks.USER_UNDER_LOADED: underloadedAssigneesCount++; break;
        case CoreTasks.USER_PROPERLY_LOADED: properlyLoadedAssigneesCount++; break;
        case CoreTasks.USER_OVER_LOADED: overloadedAssigneesCount++; break;
      }
      riskyTasksCount += assignmentNode.get('riskyTasksCount');
      failedTasksCount += assignmentNode.get('failedTasksCount');
      tasksCount = assignmentNode.get('tasksCount');
      totalTasksCount += tasksCount;
      var tasks = assignmentNode.get('treeItemChildren');
      for(var j=0; tasks && j<tasksCount; j++) {
        var task = tasks.objectAt(j);
        var submitter = task.get('submitter');
        if(submitter) {
          var submitterName = submitter.get('loginName');
          if(submitters[submitterName]) submitters[submitterName]++;
          else submitters[submitterName] = 1;
        }
        
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
          case CoreTasks.STATUS_PLANNED: plannedCount++; break;
          case CoreTasks.STATUS_ACTIVE: activeCount++; break;
          case CoreTasks.STATUS_DONE: doneCount++;
            switch(task.get('validation')) {
              case CoreTasks.TASK_VALIDATION_UNTESTED: untestedCount++; break;
              case CoreTasks.TASK_VALIDATION_PASSED: passedCount++; break;
              case CoreTasks.TASK_VALIDATION_FAILED: failedCount++; break;
            }
            break;
          case CoreTasks.STATUS_RISKY: riskyCount++; break;
        }
      }
    }
    var submittersCount = 0;
    for(var s in submitters) {
      submittersCount++;
    }
    
    var stats = {
      tasksCount: tasksCount, submittersCount: submittersCount,
      finishedTasksCount: finishedTasksCount, leftTasksCount: leftTasksCount,
      notLoadedAssigneesCount: notLoadedAssigneesCount,
      underloadedAssigneesCount: underloadedAssigneesCount,
      properlyLoadedAssigneesCount: properlyLoadedAssigneesCount,
      overloadedAssigneesCount: overloadedAssigneesCount,
      riskyTasksCount: riskyTasksCount, failedTasksCount: failedTasksCount, tasksCount: totalTasksCount,
      featureCount: featureCount, bugCount: bugCount, otherCount: otherCount,
      highCount: highCount, mediumCount: mediumCount, lowCount: lowCount,
      plannedCount: plannedCount, activeCount: activeCount, doneCount: doneCount, riskyCount: riskyCount,
      untestedCount: untestedCount, passedCount: passedCount, failedCount: failedCount
    };
    // console.log('DEBUG: computeStatistics() ' + JSON.stringify(stats));
    this.set('statistics', stats);
  
  },
  
  showStatistics: function() {
    this.computeStatistics();
    Tasks.statisticsPane.append();
  },
  
  closePanel: function() {
    this.set('statistics', '');
    Tasks.statisticsPane.remove();
  }  
    
});
