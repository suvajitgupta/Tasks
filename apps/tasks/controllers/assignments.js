// ==========================================================================
// Project:   Tasks.assignmentsController
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.ArrayController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.assignmentsController = SC.ArrayController.create(
/** @scope Tasks.assignmentsController.prototype */ {
  contentBinding: 'Tasks.projectController.tasks',
  
  nodes: function() {
    var assignees = {}, assignee, tasks, ret;
    this.forEach(
      function(rec){
				var user = rec.get('assignee');
				assignee = user? user.get('name') : Tasks.consts.USER_UNASSIGNED;
        tasks = assignees[assignee];
        if(!tasks) assignees[assignee] = tasks = [];
        tasks.push(rec);
				// console.log("debug: %@".fmt(rec.get('name')));
      }, 
      this
    );
    
    ret = [];
    for(assignee in assignees){
      if(!assignees.hasOwnProperty(assignee)) continue; // to speed up by avoiding walking up the inheritance chain
      tasks = assignees[assignee];
      ret.push(SC.Object.create({
				name: assignee,
        treeItemIsExpanded: YES,
        treeItemChildren: tasks.sortProperty('name')
      }));
    }
      
    return SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES });
    
  }.property('[]').cacheable()
});
