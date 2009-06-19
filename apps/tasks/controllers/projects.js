// ==========================================================================
// Project:   Tasks.projectsController
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.TreeController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  nodes: function() {
    var projects = [];
    this.forEach(function(rec){
        projects.push(SC.Object.create({ displayName: rec.get('displayName'), icon: rec.get('icon'), tasks: rec.get('tasks') }));
      }, this);
    return SC.Object.create({ treeItemChildren: [
      SC.Object.create({ displayName: 'Inbox', treeItemChildren: [], treeItemIsExpanded: NO}),
      SC.Object.create({ displayName: 'Projects', treeItemChildren: projects, treeItemIsExpanded: YES}),
      SC.Object.create({ displayName: 'Futures', treeItemChildren: [], treeItemIsExpanded: NO})
      ], treeItemIsExpanded: YES });
    
  }.property('[]').cacheable()
  
  
  
});
