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
    
    var assignees = {}, assignee, ret = [];
    this.forEach( // group tasks by user & separate unassigned tasks
      function(rec){
        var user = rec.get('assignee');
        assignee = user? user.get('displayName') : CoreTasks.USER_UNASSIGNED;
        var tasks = assignees[assignee];
        if(!tasks) assignees[assignee] = tasks = [];
        var name = rec.get('name');
        if(name.match(rx)) { // filter tasks that match search filter
          tasks.push(rec);
        }
      }, this);
  
    var selectedAssignee = this.get('assigneeSelection');
    if(selectedAssignee){ // only show tasks for selected user
      
      var selectedUserName = CoreTasks.get('store').find(CoreTasks.User, selectedAssignee.id).get('displayName');

      for(assignee in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assignee) && assignee === selectedUserName) {
          ret.push(this._createAssignmentNodeHash(assignee, assignees[assignee]));
        }
      }
      
    } else { // show tasks for all users
      
      for(assignee in assignees){ // list unassigned tasks first
        if(assignees.hasOwnProperty(assignee) && assignee === CoreTasks.USER_UNASSIGNED) {
          ret.push(this._createAssignmentNodeHash(assignee, assignees[assignee]));
        }
      }
      
      for(assignee in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assignee) && assignee !== CoreTasks.USER_UNASSIGNED) {
          ret.push(this._createAssignmentNodeHash(assignee, assignees[assignee]));
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
  
  _createAssignmentNodeHash: function(assignee, tasks) {
    return SC.Object.create({
      displayName: assignee,
      treeItemChildren: tasks,
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
