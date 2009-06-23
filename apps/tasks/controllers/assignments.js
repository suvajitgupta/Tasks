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
				assignee = user? user.get('displayName') : Tasks.consts.USER_UNASSIGNED;
        tasks = assignees[assignee];
        if(!tasks) assignees[assignee] = tasks = [];
        tasks.push(rec);
      }, 
      this
    );
    
    ret = [];
    for(assignee in assignees){
      if(!assignees.hasOwnProperty(assignee)) continue; // to speed up by avoiding walking up the inheritance chain
      tasks = assignees[assignee];
      ret.push(SC.Object.create({
				displayName: assignee,
				treeItemChildren: tasks.sortProperty('name'),
        treeItemIsExpanded: YES
      }));
    }
      
    return SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES });
    
  }.property('[]').cacheable()

});
