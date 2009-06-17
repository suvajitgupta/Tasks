// ==========================================================================
// Project:   Tasks.assignmentsController
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.ArrayController
*/
Tasks.assignmentsController = SC.ArrayController.create(
/** @scope Tasks.assignmentsController.prototype */ {
  contentBinding: 'Tasks.projectController.tasks',
  
  nodes: function() {
    var assignees = {}, assignee, tasks, ret;
    this.forEach(
      function(rec){
        if(assignee = rec.get('assignee').get('name')){
          tasks = assignees[assignee];
          if(!tasks) assignees[assignee] = tasks = [];
          tasks.push(rec);
        }
      }, 
      this
    );
    
    ret = [];

		var store = Tasks.get('store');
    
    for(assignee in assignees){
      //if(!assignees.hasOwnProperty(assignee)) continue;
      tasks = assignees[assignee];
      ret.push(SC.Object.create({
				name: assignee,
        treeItemIsExpanded: YES,
        treeItemChildren: tasks.sortProperty('assignee', 'name')
      }));
    }
      
    return SC.Object.create({ treeItemChildren: ret, treeItemIsExpanded: YES });
    
  }.property('[]').cacheable()
}) ;
