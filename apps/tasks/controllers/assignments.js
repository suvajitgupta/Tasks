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
    
    var assignees = {}, assigneeName, assignee, ret = [];
    this.forEach( // group tasks by user & separate unassigned tasks
      function(rec){
        var user = rec.get('assignee');
        assigneeName = user? user.get('displayName') : CoreTasks.USER_UNASSIGNED;
        assignee = user;
        var assigneeObj = assignees[assigneeName];
        if(!assigneeObj) {
          assigneeObj = { assignee: assignee, tasks: [] };
          assignees[assigneeName] = assigneeObj;
        }
        var name = rec.get('name');
        if(name.match(rx)) { // filter tasks that match search filter
          assigneeObj.tasks.push(rec);
        }
      }, this);
  
    var selectedAssignee = this.get('assigneeSelection');
    if(selectedAssignee){ // only show tasks for selected user
      
      var selectedUserName = CoreTasks.get('store').find(CoreTasks.User, selectedAssignee.id).get('displayName');

      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName) && assigneeName === selectedUserName) {
          ret.push(this._createAssignmentNodeHash(assigneeName, assignees[assigneeName]));
        }
      }
      
    } else { // show tasks for all users
      
      for(assigneeName in assignees){ // list unassigned tasks first
        if(assignees.hasOwnProperty(assigneeName) && assigneeName === CoreTasks.USER_UNASSIGNED) {
          ret.push(this._createAssignmentNodeHash(assigneeName, assignees[assigneeName]));
        }
      }
      
      for(assigneeName in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assigneeName) && assigneeName !== CoreTasks.USER_UNASSIGNED) {
          ret.push(this._createAssignmentNodeHash(assigneeName, assignees[assigneeName]));
        }
      }
      
    }
      
    this.set('assignedTasks', SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES }));
    
  },
  
  _escapeMetacharacters: function(str){
    var metaCharacters = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var s = new RegExp('(\\' + metaCharacters.join('|\\') + ')', 'g');
    return str? str.replace(s, '\\$1') : '';
  },
  
  _createAssignmentNodeHash: function(assigneeName, assigneeObj) {
    return SC.Object.create({
      displayName: assigneeName,
      assignee: assigneeObj.assignee,
      treeItemChildren: assigneeObj.tasks,
      treeItemIsExpanded: YES
    });
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
