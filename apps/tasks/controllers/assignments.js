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
  
  /*_showAllAssignments: function() { // show all tasks for a selected user across all projects
    
    var q = SC.Query.create({
      recordType: Tasks.Task, 
      conditions: "assignee = %@",
      parameters: [selectedObj]
    });
    var collection = Tasks.store.findAll(q);
    
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
    
  },*/
  
  _showAssignments: function() { // show tasks for selected user that matches search filter
    
    var assignees = {}, user, assignee, tasks, ret = [];
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
      
      var selectedUserName = Tasks.User.find(Tasks.store, selectedAssignee.id).get('displayName');
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
  
  _assigneeDidChange: function(){
    this._showAssignments();
  }.observes('assigneeSelection'),
  
  
  /*
    Updates my content based on the search property
    
    FIXME: [DC, SG, SE]
    
    BUG: How do we 'reset' the tasks back to their original state
    without re-loading the entire Projects tree?
    
  */
  _search_observer: function(){    
    var that = this;
    var finalContent = [];
    var pid = Tasks.projectController.get('id');
    
    //TODO: this is bugged, we need a way to query the original array of tasks..
    var originalTasks = Tasks.projectsController.getTasksByProjectId(pid); //many array    

    originalTasks.forEach(function(item){ 
      //console.log(item); 
      var name = item.get('name') || '';
      if(that._doesSearchValueMatch(name)){
        finalContent.pushObject(item);
      }
    });    
    this.set('content', finalContent);  
  }.observes('search'),
  
  /*
    Remove all crap that can mess up our RegEx
  */
  _sanitizeSearchString: function(str){
    var specials = [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\' ];
    var s = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
    return str ? str.replace(s, '\\$1') : '';
  },
  
  _doesSearchValueMatch: function(value){
    var s = this.get('search') || '';
    s = this._sanitizeSearchString(s);
    var rx = new RegExp(s,'i');
    return value.match(rx);
  }

});
