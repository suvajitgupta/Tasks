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
  
  assignments: function() {
  
    var assignees = {}, user, assignee, tasks, ret;
    this.forEach(
      function(rec){
        user = rec.get('assignee');
        assignee = user? user.get('displayName') : Tasks.USER_UNASSIGNED;
        tasks = assignees[assignee];
        if(!tasks) assignees[assignee] = tasks = [];
        tasks.push(rec);
      }, 
      this
    );
    
    ret = [];
    for(assignee in assignees){ // list unassigned tasks first
      if(assignees.hasOwnProperty(assignee) && assignee === Tasks.USER_UNASSIGNED) {
        ret.push(this._createNodeHash(assignee, assignees[assignee]));
      }
    }
      
    for(assignee in assignees){ // list all assi
      if(assignees.hasOwnProperty(assignee) && assignee !== Tasks.USER_UNASSIGNED) {
        ret.push(this._createNodeHash(assignee, assignees[assignee]));
      }
    }
      
    return SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES });
    
  }.property('[]').cacheable(),
  
  _createNodeHash: function(assignee, tasks) {
    return SC.Object.create({
      displayName: assignee,
      treeItemChildren: tasks,
      treeItemIsExpanded: YES
    });
  }

});
