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
    
    var assignees = {}, assigneeName, assignee, assignmentNodes = [];
    this.forEach( // group tasks by user & separate unassigned tasks
      function(task){
        assignee = task.get('assignee');
        assigneeName = assignee? assignee.get('displayName') : CoreTasks.USER_UNASSIGNED;
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
            this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName]);
          }
        }
      }
      
    } else { // show tasks for all users
      for(assigneeName in assignees){ // list unassigned tasks first
        if(assignees.hasOwnProperty(assigneeName) && assigneeName === CoreTasks.USER_UNASSIGNED) {
          this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName]);
        }
      }
      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName) && assigneeName !== CoreTasks.USER_UNASSIGNED) {
          this._createAssignmentNode(assignmentNodes, assigneeName, assignees[assigneeName]);
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
   * @returns {Object) return a node to be inserted into the tree view.
   */
  _createAssignmentNode: function(assignmentNodes, assigneeName, assigneeObj) {
    
    var taskWithUnspecifiedEffort = false;
    var displayName = assigneeName;
    var effortString, totalEffortMin = 0, totalEffortMax = 0, effortMin, effortMax;
    var task, tasks = assigneeObj.tasks;
    var len = tasks.get('length');
    if (len === 0) return; // nothing to do
    
    for (var i = 0; i < len; i++) {
      task = tasks.objectAt(i);
      
      // Add observers to certain task properties that can require the assignmentsController to redraw.
      task.removeObserver('effort',Tasks.assignmentsController,'_contentHasChanged');
      task.removeObserver('priority',Tasks.assignmentsController,'_contentHasChanged');
      task.removeObserver('assignee',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('effort',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('priority',Tasks.assignmentsController,'_contentHasChanged');
      task.addObserver('assignee',Tasks.assignmentsController,'_contentHasChanged');
      
      // Extract/total effort for each taek (simple number or a range)
      effortString = task.get('effort');
      if(!effortString) taskWithUnspecifiedEffort = true;
      if(effortString && task.get('priority') !== CoreTasks.TASK_PRIORITY_LOW) {
        // sum up effort for High/Medium priority tasks
        effortMin = parseFloat(effortString, 10);
        var idx = effortString.indexOf('-'); // see if effort is a range
        if(idx === -1) { // not a range
          effortMax = effortMin;
        }
        else { // effort IS a range, extract max
          effortMax = parseFloat(effortString.slice(idx+1), 10);
        }
        totalEffortMin += effortMin;
        totalEffortMax += effortMax;
      }
    }
    if(totalEffortMin !== 0) {
      var totalEffort = '' + totalEffortMin;
      if (totalEffortMax !== totalEffortMin) {
        totalEffort += '-' + totalEffortMax;
      }
      displayName = displayName + ' {' + totalEffort + (taskWithUnspecifiedEffort? '?' : '') + '}';
    }
    
    assignmentNodes.push (SC.Object.create({
      displayName: displayName,
      assignee: assigneeObj.assignee,
      treeItemChildren: tasks,
      treeItemIsExpanded: YES
    }));
  },
  
  _contentHasChanged: function() {
    this.showAssignments();
  }.observes('[]'),
  
  _assigneeHasChanged: function() {
    this.showAssignments();
  }.observes('assigneeSelection'),
  
  _searchFilterHasChanged: function() {
    this.showAssignments();
  }.observes('searchFilter')
  
});
