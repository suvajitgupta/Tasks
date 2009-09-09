// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  This controller manages what is displayed in the Tasks detail screen.
  This is affected by the selected Project/User and the search criteria.
  
  @extends SC.ArrayController
  @author Joshua Holt
  @author Suvajit Gupta
*/
Tasks.assignmentsController = SC.ArrayController.create(
/** @scope Tasks.assignmentsController.prototype */ {
  
  contentBinding: 'Tasks.projectController.tasks',
  assignedTasks: null,
  assigneeSelection: null,
  searchFilter: null,
  
  
  showAssignments: function() { // show tasks for selected user that matches search filter
   
    var sf = this.get('searchFilter');
    sf = this._escapeMetacharacters(sf);
    var rx = new RegExp(sf, 'i');
    
    // Get time left, if any specified, in selected project.
    var projectTimeLeft = null;
    var sel = Tasks.getPath('projectsController.selection');
    if (sel && sel.length() > 0) {
      var project = sel.firstObject();
      projectTimeLeft = project.get('timeLeft');
    }
      
    // Group tasks by user & separate unassigned tasks
    var assignees = {}, assigneeName, assignee, assignmentNodes = [];
    this.forEach( 
      function(task){
        assignee = task.get('assignee');
        if (assignee && !assignee.get) { // HACK: [BB] unclear why assigneee.get() is null at times
          return;
        }
        assigneeName = assignee ? assignee.get('displayName') : CoreTasks.USER_UNASSIGNED;
        var assigneeObj = assignees[assigneeName];
        if(!assigneeObj) {
          assigneeObj = { assignee: assignee, tasks: [] };
          assignees[assigneeName] = assigneeObj;
        }
        var taskName = task.get('name');
        if(taskName.match(rx)) { // filter tasks that match search filter
          assigneeObj.tasks.push(task);
        }
      }, this);
  
    var selectedAssigneeDisplayNames = [];
    var selectedAssignees = this.get('assigneeSelection');
    if (selectedAssignees) {
      var selectedAssigneeLoginNames = selectedAssignees.split(" ");
      for (var i = 0; i < selectedAssigneeLoginNames.length; i++) {
        var selectedAssigneeUser = CoreTasks.getUser(selectedAssigneeLoginNames[i]);
        if (selectedAssigneeUser) selectedAssigneeDisplayNames.push(selectedAssigneeUser.get('displayName'));
      }
    }
    
    if(selectedAssigneeDisplayNames.length > 0){ // only show tasks for selected assignee(s)
      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName)) {
          if(selectedAssigneeDisplayNames.indexOf(assigneeName) !== -1) {
            this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName], projectTimeLeft);
          }
        }
      }
      
    } else { // show tasks for all users
      for(assigneeName in assignees){ // list unassigned tasks first
        if(assignees.hasOwnProperty(assigneeName) && assigneeName === CoreTasks.USER_UNASSIGNED) {
          this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName], projectTimeLeft);
        }
      }
      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName) && assigneeName !== CoreTasks.USER_UNASSIGNED) {
          this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName], projectTimeLeft);
        }
      }
    }
      
    this.set('assignedTasks', SC.Object.create({ treeItemChildren: assignmentNodes.sort(function(a,b) {
      if (a.displayName===b.displayName) return 0;
      return (a.displayName > b.displayName) ? 1 : -1;
    }), treeItemIsExpanded: YES }));
    
  },
  
  _escapeMetacharacters: function(str){
    var metaCharacters = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var s = new RegExp('(\\' + metaCharacters.join('|\\') + ')', 'g');
    return str? str.replace(s, '\\$1') : '';
  },
  
  /**
   * Create a node in the tree showing a user's tasks.
   *
   * @param {Array} set of assignment nodes.
   * @param {String} assignee name.
   * @param {Object} a hash of assignee ID and tasks array.
   * @param {Number} amount of time left in project.
   * @returns {Object) return a node to be inserted into the tree view.
   */
  _createAssignmentNode: function(assignmentNodes, assigneeName, assigneeObj, projectTimeLeft) {
    
    var taskWithUnspecifiedEffort = false;
    var displayName = assigneeName;
    var effortString, totalEffortMin = 0, totalEffortMax = 0, effortMin, effortMax;
    var task, tasks = assigneeObj.tasks;
    var len = tasks.get('length');
    if (len === 0) return; // nothing to do
    
    for (var i = 0; i < len; i++) {
      task = tasks.objectAt(i);
      
      // Add observers to certain task properties that can require the assignmentsController to redraw.
      task.removeObserver('assignee',Tasks.assignmentsController,'_contentHasChanged');
      task.removeObserver('priority',Tasks.assignmentsController,'_contentHasChanged');
      task.removeObserver('status',Tasks.assignmentsController,'_contentHasChanged');
      task.removeObserver('effort',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('assignee',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('priority',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('status',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('effort',Tasks.assignmentsController,'_contentHasChanged');
      
      // Extract/total effort for each incomplete taek (simple number or a range)
      if(task.get('status') === CoreTasks.TASK_STATUS_DONE) continue;
      effortString = task.get('effort');
      if(!effortString) taskWithUnspecifiedEffort = true;
      if(effortString && task.get('priority') !== CoreTasks.TASK_PRIORITY_LOW) {
        // sum up effort for High/Medium priority tasks
        effortMin = parseFloat(parseFloat(effortString, 10).toFixed(2));
        var idx = effortString.indexOf('-'); // see if effort is a range
        if(idx === -1) { // not a range
          effortMax = effortMin;
        }
        else { // effort IS a range, extract max
          effortMax = parseFloat(parseFloat(effortString.slice(idx+1), 10).toFixed(2));
        }
        totalEffortMin = parseFloat((totalEffortMin + effortMin).toFixed(2));
        totalEffortMax = parseFloat((totalEffortMax + effortMax).toFixed(2));
      }
    }
  
    var loading = CoreTasks.USER_NOT_OR_UNDER_LOADED;
    if(totalEffortMin !== 0) {
      if(projectTimeLeft) { // flag user loading
        var effortGap = totalEffortMin - projectTimeLeft;
        if(effortGap >= -2 && effortGap <= 2) loading = CoreTasks.USER_PROPERLY_LOADED;
        else if(effortGap > 2) loading = CoreTasks.USER_OVER_LOADED;
      }
      var totalEffort = '' + totalEffortMin;
      if (totalEffortMax !== totalEffortMin) {
        totalEffort += '-' + totalEffortMax;
      }
      displayName = displayName + ' {' + totalEffort + (taskWithUnspecifiedEffort? '?' : '') + '}';
    }
    
    assignmentNodes.push (SC.Object.create({
      displayName: displayName,
      loading: loading,
      assignee: assigneeObj.assignee,
      treeItemChildren: tasks,
      treeItemIsExpanded: YES
    }));
  },
  
  _contentHasChanged: function() {
    // console.log("Tasks pane content change at " + new Date());
    this.showAssignments();
  }.observes('[]'),
  
  _assigneeSelectionHasChanged: function() {
    // console.log("Assignee selection changed at " + new Date());
    Tasks.deselectTasks();
    this.showAssignments();
  }.observes('assigneeSelection'),
  
  _searchFilterHasChanged: function() {
    // console.log("Search filter changed at " + new Date());
    Tasks.deselectTasks();
    this.showAssignments();
  }.observes('searchFilter')
  
});
