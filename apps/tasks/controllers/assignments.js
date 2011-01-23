// ==========================================================================
// Tasks.assignmentsController
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  This controller groups assignments to be displayed in Tasks detail screen.
  Its output is affected by the filter and search criteria.
  
  @extends SC.ArrayController
  @author Joshua Holt
  @author Suvajit Gupta
*/

// The display mode affects how the assignments are shown ("team" or "tasks" focus)
Tasks.DISPLAY_MODE_TASKS = true;
Tasks.DISPLAY_MODE_TEAM = false;

Tasks.recomputeTasksNeeded = false;

Tasks.assignmentsController = SC.ArrayController.create(
/** @scope Tasks.assignmentsController.prototype */ {
  
  // contentBinding: SC.Binding.oneWay('Tasks.projectController.tasks'), // single-project selection mode
  contentBinding: SC.Binding.oneWay('Tasks.projectController.assignments'), // multi-project selection mode
  
  _attributeFilterCriteriaBinding: 'Tasks.filterSearchController.attributeFilterCriteria',
  _effortSpecifiedBinding: 'Tasks.filterSearchController.effortSpecified',
  _recentlyUpdatedBinding: 'Tasks.filterSearchController.recentlyUpdated',
  _watchedBinding: 'Tasks.filterSearchController.watched',
  _tasksSearchBinding: 'Tasks.filterSearchController.tasksSearch',
  
  
  _showTasks: true,
  
  displayMode: function(key, value) {
    if (value !== undefined) {
      // console.log('DEBUG: setting displayMode to ' + (value? 'TASKS' : 'TEAM'));
      if(!value) Tasks.filterSearchController.setAssigneeTasksSearch();
      this.set('_showTasks', value);
    } else {
      return this.get('_showTasks');
    }
  }.property('_showTasks').cacheable(),
  
  
  tasks: null,
  
  callCounter: 1, // used for tracking/tuning calls to computeTasks()
  computeTasks: function() { // show tasks for selected user that matches search filter
    
    // console.log('DEBUG: computeTasks() call #' + this.callCounter++ + ' with ' + this.getPath('content.length') + ' items');
    // Preserve selected tasks to be restored at the end of rendering
    var selection = Tasks.tasksController.get('selection');
    var idPattern = null, searchPattern = null, positiveMatch = true;
    var tasksSearch = this.get('_tasksSearch');
    
    // Extract selected users ([Assignees] or <Submitters>)
    var i, j, assigneeSelectionDisplayNames = [], submitterSelectionDisplayNames = [];
    if (tasksSearch && tasksSearch !== '') { // if a search filter is specified
      var assigneeSelection = tasksSearch.match(/\[.*\]/);
      if (assigneeSelection) { // if assignee selection is specified
        assigneeSelection += ''; // convert to string
        tasksSearch = tasksSearch.replace(assigneeSelection, ''); // remove assignee selection from search filter
        assigneeSelection = assigneeSelection.substr(1,assigneeSelection.length-2);
        var assigneeSelectionNames = assigneeSelection.replace(/,/g, ' ').replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
        if (assigneeSelection !== '') {
          assigneeSelectionNames = assigneeSelectionNames.split(' ');
          for (i = 0; i < assigneeSelectionNames.length; i++) {
            var assigneeSelectionName = assigneeSelectionNames[i];
            if(assigneeSelectionName.toLowerCase() === CoreTasks.USER_NONE) {
              assigneeSelectionDisplayNames.push(CoreTasks.USER_UNASSIGNED);
            }
            else {
              var selectedAssigneeUsers = CoreTasks.getUsersMatchingName(assigneeSelectionName);
              if (selectedAssigneeUsers.length > 0) {
                for (j = 0; j < selectedAssigneeUsers.length; j++) {
                  assigneeSelectionDisplayNames.push(selectedAssigneeUsers[j].get('displayName'));
                }
              }
            }
            // console.log('DEBUG: assignees: ' + assigneeSelectionDisplayNames);
          }
        }
      }
      var submitterSelection = tasksSearch.match(/\<.*\>/);
      if (submitterSelection) { // if submitter selection is specified
        submitterSelection += ''; // convert to string
        tasksSearch = tasksSearch.replace(submitterSelection, ''); // remove submitter selection from search filter
        submitterSelection = submitterSelection.substr(1,submitterSelection.length-2);
        var submitterSelectionNames = submitterSelection.replace(/,/g, ' ').replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
        if (submitterSelection !== '') {
          submitterSelectionNames = submitterSelectionNames.split(' ');
          for (i = 0; i < submitterSelectionNames.length; i++) {
            var submitterSelectionName = submitterSelectionNames[i];
            if(submitterSelectionName.toLowerCase() === CoreTasks.USER_NONE) {
              submitterSelectionDisplayNames.push(CoreTasks.USER_UNASSIGNED);
            }
            else {
              var selectedSubmitterUsers = CoreTasks.getUsersMatchingName(submitterSelectionName);
              if (selectedSubmitterUsers.length > 0) {
                for (j = 0; j < selectedSubmitterUsers.length; j++) {
                  submitterSelectionDisplayNames.push(selectedSubmitterUsers[j].get('displayName'));
                }
              }
            }
          }
          // console.log('DEBUG: submitters: ' + submitterSelectionDisplayNames);
        }
      }
    
      // Extract task name search filter
      tasksSearch = this._escapeMetacharacters(tasksSearch).replace(/^\s+/, '').replace(/\s+$/, '');
      // console.log('DEBUG: tasksSearch: ' + tasksSearch);
      var idMatches = tasksSearch.match(/#([\-\d]+)/g);
      // console.log('DEBUG: idMatches = ' + idMatches);
      if(!idMatches) {
        if (tasksSearch.indexOf('^') === 0) { // inverse search specified
          positiveMatch = false;
          tasksSearch = tasksSearch.slice(1);
        }
        searchPattern = new RegExp(tasksSearch, 'i');
      }
    }
    
    // Get time left, if any specified, in selected project.
    var projectTimeLeft = null;
    var sel = Tasks.getPath('projectsController.selection');
    if (sel && sel.length() === 1) {
      var project = sel.firstObject();
      if (project) projectTimeLeft = CoreTasks.convertTimeToDays(project.get('countDown'));
    }
      
    // Group tasks by user & separate unassigned tasks
    var assignees = {}, submitter, submitterName, assigneeName, assignee, assignmentNodes = [];
    this.forEach(function(task){
      // console.log("Task Name: " + task.get('name') + "; Id: " + task.get('id'));
      assignee = task.get('assignee');
      submitter = task.get('submitter');
      var taskName = task.get('name');
      var taskDescription = task.get('description');
      var isNewTask = (taskName === CoreTasks.NEW_TASK_NAME.loc()); // Always display "new task"s
      assigneeName = assignee? assignee.get('displayName') : CoreTasks.USER_UNASSIGNED;
      submitterName = submitter? submitter.get('displayName') : CoreTasks.USER_UNASSIGNED;
      if(isNewTask || assigneeSelectionDisplayNames.length === 0 || assigneeSelectionDisplayNames.indexOf(assigneeName) !== -1) {
        
        var assigneeTasks = assignees[assigneeName];
        if(!assigneeTasks) {
          assigneeTasks = { assignee: assignee, tasks: [] };
          assignees[assigneeName] = assigneeTasks;
        }
        
        // Extract tasks that meet filter criteria
        if(!isNewTask) {
          
          if(submitterSelectionDisplayNames.length !== 0 && submitterSelectionDisplayNames.indexOf(submitterName) === -1) return;
        
          var attributeFilterCriteria = this.get('_attributeFilterCriteria');
          var type = task.get('type');
          if(attributeFilterCriteria.indexOf(type) === -1) return;
          var priority = task.get('priority');
          if(attributeFilterCriteria.indexOf(priority) === -1) return;
          var developmentStatus = task.get('developmentStatus');
          if(attributeFilterCriteria.indexOf(developmentStatus) === -1) return;
          if(developmentStatus === CoreTasks.STATUS_DONE) {
            var validation = task.get('validation');
            if(attributeFilterCriteria.indexOf(validation) === -1) return;
          }
          
          var effortSpecified = this.get('_effortSpecified');
          if(effortSpecified !== Tasks.FILTER_DONT_CARE) {
            var taskEffortSpecified = !SC.none(task.get('effort'));
            if(effortSpecified === Tasks.FILTER_YES && !taskEffortSpecified) return;
            if(effortSpecified === Tasks.FILTER_NO && taskEffortSpecified) return;
          }
          
          var recentlyUpdated = this.get('_recentlyUpdated');
          if(recentlyUpdated !== Tasks.FILTER_DONT_CARE) {
            var taskRecentlyUpdated = task.get('isRecentlyUpdated');
            if(recentlyUpdated === Tasks.FILTER_YES && !taskRecentlyUpdated) return;
            if(recentlyUpdated === Tasks.FILTER_NO && taskRecentlyUpdated) return;
          }
          
          var watched = this.get('_watched');
          if(watched !== Tasks.FILTER_DONT_CARE) {
            if(watched === Tasks.FILTER_MY_WATCHES && !CoreTasks.isCurrentUserWatchingTask(task)) return;
            if(watched === Tasks.FILTER_ANY_WATCHES && !CoreTasks.isAnyUserWatchingTask(task)) return;
          }
          
          if(idMatches) { // one or more exact ID matches of task ID or IDs in name
            var taskId = task.get('displayId');
            if(idMatches.indexOf(taskId) === -1) { // doesn't match task ID exactly
              // see if any task ID entered in the search is a part of the task name
              var taskHasID = false;
              for (var i = 0; !taskHasID && i < idMatches.length; i++) {
                var searchText = taskName + (taskDescription? taskDescription : '');
                var taskIdMatches = searchText.match(/#([\-\d]+)/g);
                if(taskIdMatches) { // task name has IDs in it
                  for (var j=0; j < taskIdMatches.length; j++) {
                    if(taskIdMatches[j] === idMatches[i]) { // found match!
                      taskHasID = true;
                      break;
                    }
                  }
                }
              }
              if(!taskHasID) return;
            }
          }
          else if(searchPattern) { // case insensitive search of task name and/or description
            var nameMatches = taskName.match(searchPattern);
            if(positiveMatch) { // find what matches search pattern
              if(!nameMatches) { // try matching description
                if(!taskDescription || !taskDescription.match(searchPattern)) return;
              }
            }
            else { // inverse search - what doesn't match search pattern
              if(nameMatches) return;
              if(taskDescription && taskDescription.match(searchPattern)) return;
            }
          }
        }
        assigneeTasks.tasks.push(task);
      }
    }, this);
  
    for(assigneeName in assignees){
      if(assignees.hasOwnProperty(assigneeName)) {
          this._createAssignmentNode(assignmentNodes, assignees[assigneeName], projectTimeLeft);
      }
    }
      
    // Sort grouped tasks by assignee
    this.set('tasks', SC.Object.create({ treeItemChildren: assignmentNodes.sort(function(a, b) {
      if(!Tasks.assignmentsController._showTasks) { // TEAM display mode, first try to sort in descending order of loading/red flags
        if(a.loading !== CoreTasks.USER_NOT_LOADED && b.loading !== CoreTasks.USER_NOT_LOADED) {
          var loadingDelta = b.effortGapPercent - a.effortGapPercent;
          if(loadingDelta !== 0) return loadingDelta;
          var redFlagsDelta = (b.riskyTasksCount + b.failedTasksCount) - (a.riskyTasksCount + a.failedTasksCount);
          if(redFlagsDelta !== 0) return redFlagsDelta;
        }
        else if(b.loading === CoreTasks.USER_NOT_LOADED && a.loading !== CoreTasks.USER_NOT_LOADED) {
          return -1;
        }
        else if(b.loading !== CoreTasks.USER_NOT_LOADED && a.loading === CoreTasks.USER_NOT_LOADED) {
          return 1;
        }
        else if (a.totalFinishedEffortAve !== 0 || b.totalFinishedEffortAve !== 0) {
          return a.totalFinishedEffortAve - b.totalFinishedEffortAve;
        }
      }
      // Alpha sort by display names
      if (a.displayName === b.displayName) return 0;
      return (a.displayName > b.displayName) ? 1 : -1;
    }), treeItemIsExpanded: YES }));
    
    if(selection) Tasks.tasksController.selectObjects(selection);
    Tasks.recomputeTasksNeeded = false;    

  },
  
  _escapeMetacharacters: function(string){
    var metaCharacters = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var pattern = new RegExp('(\\' + metaCharacters.join('|\\') + ')', 'g');
    return string? string.replace(pattern, '\\$1') : '';
  },
  
  /**
   * Create a node in the tree showing a user's tasks.
   *
   * @param {Array} set of assignment nodes.
   * @param {Object} a hash of assignee and tasks array.
   * @param {Number} amount of time left in project.
   * @returns {Object) return a node to be inserted into the tree view.
   */
  _createAssignmentNode: function(assignmentNodes, assigneeTasks, projectTimeLeft) {
    
    var displayName = assigneeTasks.assignee? assigneeTasks.assignee.get('displayName') : CoreTasks.USER_UNASSIGNED;
    var taskWithUnspecifiedEffort = false, doneTaskWithUnspecifiedEffort = false;
    var effortString, totalFinishedEffortMin = 0, totalFinishedEffortMax = 0, totalEffortMin = 0, totalEffortMax = 0, effortMin, effortMax;
    var totalFinishedCount = 0, totalLeftCount = 0;
    var task, tasks = assigneeTasks.tasks;
    var tasksCount = tasks.get('length');
    var riskyTasksCount = 0;
    var failedTasksCount = 0;
    if (tasksCount === 0) return; // nothing to do
    
    for (var i = 0; i < tasksCount; i++) {
      
      task = tasks.objectAt(i);
      
      // Extract/total effort for each task (simple number or a range)
      effortString = task.get('effort');
      var priority = task.get('priority');
      var developmentStatus = task.get('developmentStatus');
      var validation = task.get('validation');
      
      if(developmentStatus === CoreTasks.STATUS_DONE && validation !== CoreTasks.TASK_VALIDATION_FAILED) totalFinishedCount++;
      else if (priority !== CoreTasks.TASK_PRIORITY_LOW) totalLeftCount++;
      
      if(developmentStatus === CoreTasks.STATUS_RISKY) riskyTasksCount++;
      if(validation === CoreTasks.TASK_VALIDATION_FAILED) failedTasksCount++;
      
      if(!effortString && priority !== CoreTasks.TASK_PRIORITY_LOW) {
        if(developmentStatus === CoreTasks.STATUS_DONE) doneTaskWithUnspecifiedEffort = true;
        else taskWithUnspecifiedEffort = true;
      }
      if(effortString) { // sum up task effort
        var timeUnit = CoreTasks.getTimeUnit(effortString);
        effortMin = parseFloat(parseFloat(effortString, 10).toFixed(3));
        effortMin = CoreTasks.convertTimeToDays(effortMin + timeUnit);
        var idx = effortString.indexOf('-'); // see if effort is a range
        if(idx === -1) { // not a range
          effortMax = effortMin;
        }
        else { // effort IS a range, extract max
          effortMax = parseFloat(parseFloat(effortString.slice(idx+1), 10).toFixed(3));
          effortMax = CoreTasks.convertTimeToDays(effortMax + timeUnit);
        }
        if(developmentStatus === CoreTasks.STATUS_DONE && validation !== CoreTasks.TASK_VALIDATION_FAILED) {
          totalFinishedEffortMin = parseFloat((totalFinishedEffortMin + effortMin).toFixed(3));
          totalFinishedEffortMax = parseFloat((totalFinishedEffortMax + effortMax).toFixed(3));
        }
        else if (priority !== CoreTasks.TASK_PRIORITY_LOW) { // leave out Low priority items in totals
          totalEffortMin = parseFloat((totalEffortMin + effortMin).toFixed(3));
          totalEffortMax = parseFloat((totalEffortMax + effortMax).toFixed(3));
        }
      }
    }
  
    var finishedEffort = '';
    if(totalFinishedCount) finishedEffort += (totalFinishedCount + "_finished".loc());
    var totalFinishedEffortAve = 0;
    if(totalFinishedEffortMin !== 0) {
      totalFinishedEffortAve = (totalFinishedEffortMin + totalFinishedEffortMax)/2;
      var totalFinishedEffort = '' + parseFloat(totalFinishedEffortMin.toFixed(1));
      if (totalFinishedEffortMax !== totalFinishedEffortMin) {
        totalFinishedEffort += '-' + parseFloat(totalFinishedEffortMax.toFixed(1));
      }
      finishedEffort += ("_total".loc() + CoreTasks.displayTime(totalFinishedEffort) + (doneTaskWithUnspecifiedEffort? '?' : ''));
    }
    
    var loading = CoreTasks.USER_NOT_LOADED;
    var displayEffort = '';
    if(totalLeftCount) displayEffort += (totalLeftCount + "_left".loc());
    var effortGap = 0, effortGapPercent = 0;
    if(totalEffortMin !== 0) {
      if(projectTimeLeft) { // flag user loading
        var totalEffortAve = (totalEffortMin + totalEffortMax)/2;
        effortGap = totalEffortAve - projectTimeLeft;
        effortGapPercent = 100*effortGap/projectTimeLeft;
        if(effortGap < 1 && effortGapPercent < -15) loading = CoreTasks.USER_UNDER_LOADED;
        else if(effortGap > 1 && effortGapPercent > 15) loading = CoreTasks.USER_OVER_LOADED;
        else loading = CoreTasks.USER_PROPERLY_LOADED;
      }
      var totalEffort = '' + parseFloat(totalEffortMin.toFixed(1));
      if (totalEffortMax !== totalEffortMin) {
        totalEffort += '-' + parseFloat(totalEffortMax.toFixed(1));
      }
      displayEffort += ("_total".loc() + CoreTasks.displayTime(totalEffort) + (taskWithUnspecifiedEffort? '?' : ''));
    }
    else if(taskWithUnspecifiedEffort && totalLeftCount && projectTimeLeft) { // have tasks but don't have any estimates
      displayEffort += "_total".loc() + '?';
    }
    
    assignmentNodes.push (SC.Object.create({
      displayName: displayName,
      tasksCount: tasksCount,
      finishedTasksCount: totalFinishedCount,
      finishedEffort: finishedEffort,
      totalFinishedEffortAve: totalFinishedEffortAve,
      leftTasksCount: totalLeftCount,
      displayEffort: displayEffort,
      effortGapPercent: effortGapPercent,
      riskyTasksCount:  riskyTasksCount,
      failedTasksCount:  failedTasksCount,
      loading: loading,
      assignee: assigneeTasks.assignee,
      treeItemChildren: Tasks.assignmentsController._showTasks? tasks.sort(function(a,b) {
        // sort by status, then by validation (if "Done"), then by priority, then by type
        
        var aStatus = a.get('developmentStatus');
        var bStatus = b.get('developmentStatus');
        if(aStatus !== bStatus) return CoreTasks.taskStatusWeights[bStatus] - CoreTasks.taskStatusWeights[aStatus];
        
        if(aStatus === CoreTasks.STATUS_DONE) {
          var aValidation = a.get('validation');
          var bValidation = b.get('validation');
          if(aValidation !== bValidation) return CoreTasks.taskValidationWeights[bValidation] - CoreTasks.taskValidationWeights[aValidation];
        }
        
        var aPriority = a.get('priority');
        var bPriority = b.get('priority');
        if(aPriority !== bPriority) return CoreTasks.taskPriorityWeights[bPriority] - CoreTasks.taskPriorityWeights[aPriority];
        
        var aType = a.get('type');
        var bType = b.get('type');
        if(aType !== bType) return CoreTasks.taskTypeWeights[bType] - CoreTasks.taskTypeWeights[aType];
        
        // var aID = a.get('id');
        // var bID = b.get('id');
        // if(aID < 0 && bID < 0) return bID - aID;
        // else if(aID < 0) return 1;
        // else if(bID < 0) return -1;
        // else return aID - bID;
        
        // Finally alpha sort by names, or optionally numerically if task name starts with a number
        var aName = a.get('name');
        var bName = b.get('name');
        if (aName === bName) return 0;
        else {
          var aIndexMatches = /^(\d+\.\d+|\d+)/.exec(aName);
          if(aIndexMatches) {
            var bIndexMatches = /^(\d+\.\d+|\d+)/.exec(bName);
            if(bIndexMatches) {
              return parseFloat(aIndexMatches[1]) - parseFloat(bIndexMatches[1]);
            }
          }
          return (aName > bName) ? 1 : -1;
        }
        
      }) : null,
      treeItemIsExpanded: true
    }));
  },
  
  _timer: null,
  
  _contentNeedsRedrawing: function() {
    // console.log('DEBUG: _contentNeedsRedrawing() recomputeTasksNeeded=' + Tasks.recomputeTasksNeeded);
    Tasks.recomputeTasksNeeded = true;    
    if(Tasks.panelOpen === Tasks.TASK_EDITOR || Tasks.panelOpen === Tasks.FILTER_EDITOR) return;
  	if (this._timer) { // called as a result of a timer set for assignee selection or search filter changes
      this._timer.invalidate();
      this._timer = null;
    }
  	this.invokeLast(this.computeTasks);
  }.observes('[]', '_showTasks', '_attributeFilterCriteria', '_effortSpecified', '_recentlyUpdated', '_watched'),
  
  _tasksSearchDidChange: function() {
    // console.log('DEBUG: Tasks search changed to "' + this.get('_tasksSearch') + '"');
    // Allow typing delay over a half second before redrawing tasks pane
    if (this._timer) this._timer.invalidate();
    this._timer = this.invokeLater(this._contentNeedsRedrawing, 500);
  }.observes('_tasksSearch'),
  
  
  assignmentsSummary: function() {
    
    var ret = '';
    
    var assigneesCount = 0;
    var assignmentNodes = this.getPath('tasks.treeItemChildren');
    if(assignmentNodes) assigneesCount = assignmentNodes.get('length');
    ret += (assigneesCount + "_assignees".loc());

    var tasksCount = 0;
    var redFlags = 0;
    for(var i=0; i < assigneesCount; i++) {
      var assignmentNode = assignmentNodes.objectAt(i);
      tasksCount += assignmentNode.get('tasksCount');
      var riskyTasksCount = assignmentNode.get('riskyTasksCount');
      var failedTasksCount = assignmentNode.get('failedTasksCount');
      if(riskyTasksCount > 0 || failedTasksCount > 0) redFlags++;
    }
    if(this.get('displayMode') === Tasks.DISPLAY_MODE_TASKS) {
      ret += tasksCount + "_tasks".loc();
    }
    else { // this.displayMode === Tasks.DISPLAY_MODE_TEAM
      ret += redFlags + "_redFlags".loc();
    }
    
    // console.log('DEBUG: assignmentsSummary = ' + ret);
    return ret;

  }.property('tasks').cacheable()
  
});
