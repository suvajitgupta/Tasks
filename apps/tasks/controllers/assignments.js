// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks */

/** 

  This controller extracts the assigned Tasks for the selected Project
  
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
  
  _showAllAssignments: function() { // show all tasks for a selected user across all projects
    
    var store = Tasks.get('store');
    var selectedUser = Tasks.User.find(store, this.get('assigneeSelection').id);
    var assignments = store.findAll(SC.Query.create({
      recordType: Tasks.Task, 
      conditions: "assignee = %@",
      parameters: [selectedUser]
    }));
    
    var ret = [];
    ret.push(this._createAssignmentNodeHash(selectedUser.get('displayName'), assignments));
    this.set('assignedTasks', SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES }));
    
  },
  
  _showAssignments: function() { // show tasks for selected user that matches search filter
    
    var assignees = {}, assignee, user, tasks, ret = [];
    this.forEach( // group tasks by user & separate unassigned tasks
      function(rec){
        user = rec.get('assignee');
        assignee = user? user.get('displayName') : Tasks.USER_UNASSIGNED;
        tasks = assignees[assignee];
        if(!tasks) assignees[assignee] = tasks = [];
        tasks.push(rec);
      },this);
  
    var selectedAssignee = this.get('assigneeSelection');
    if(selectedAssignee){ // only show tasks for selected user
      
      var selectedUserName = Tasks.User.find(Tasks.get('store'), selectedAssignee.id).get('displayName');
      for(assignee in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assignee) && assignee === selectedUserName) {
          ret.push(this._createAssignmentNodeHash(assignee, assignees[assignee]));
        }
      }
      
    } else { // show tasks for all users
      
      for(assignee in assignees){ // list unassigned tasks first
        if(assignees.hasOwnProperty(assignee) && assignee === Tasks.USER_UNASSIGNED) {
          ret.push(this._createAssignmentNodeHash(assignee, assignees[assignee]));
        }
      }
      
      for(assignee in assignees){ // list all assigned tasks
        if(assignees.hasOwnProperty(assignee) && assignee !== Tasks.USER_UNASSIGNED) {
          ret.push(this._createAssignmentNodeHash(assignee, assignees[assignee]));
        }
      }
      
    }
      
    this.set('assignedTasks', SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES }));
    
  },
  
  _createAssignmentNodeHash: function(assignee, tasks) {
    return SC.Object.create({
      displayName: assignee,
      treeItemChildren: tasks,
      treeItemIsExpanded: YES
    });
  },
  
  _contentHasChanged: function(){
    this._showAssignments();
  }.observes('content'),
  
  _assigneeHasChanged: function(){
    this._showAssignments();
  }.observes('assigneeSelection'),
  
  
  _searchFilterHasChanged: function(){ // FIXME: [SG] restore after clearing search
    
    var that = this;
    var finalContent = [];
    var pid = Tasks.projectController.get('id');
    
    // FIXME: [SG] this is buggy, we need a way to query the original array of tasks..
    var originalTasks = Tasks.projectsController.getTasksByProjectId(pid); // many array    
    originalTasks.forEach(function(item){ 
      var name = item.get('name') || '';
      if(that._matchSearchFilter(name)){
        finalContent.pushObject(item);
      }
    });    
    this.set('content', finalContent);
    
  }.observes('searchFilter'),
  
  _sanitizeSearchString: function(str){
    var specials = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var s = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    return str? str.replace(s, '\\$1') : '';
  },
  
  _matchSearchFilter: function(value){
    var s = this.get('searchFilter') || '';
    s = this._sanitizeSearchString(s);
    var rx = new RegExp(s, 'i');
    return value.match(rx);
  }

});
