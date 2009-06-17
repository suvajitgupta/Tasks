// ==========================================================================
// Project:   Tasks.projectsController
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.TreeController
*/
Tasks.projectsController = SC.ArrayController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  allowsMultipleSelection: NO,
  allowsEmptySelection: NO,
  
  nodes: function() {
    var ret = [];
    this.forEach(function(rec){
        ret.push(SC.Object.create({ title: rec.get('name'),  projectIcon: rec.get('projectIcon'), tasks: rec.get('tasks') }));
      }, this);
    return SC.Object.create({ treeItemChildren: [
      SC.Object.create({ title: 'Inbox', treeItemChildren: [], treeItemIsExpanded: NO}),
      SC.Object.create({ title: 'Projects', treeItemChildren: ret, treeItemIsExpanded: YES})
      ], treeItemIsExpanded: YES });
    
  }.property('[]').cacheable()
  
  
  
}) ;
