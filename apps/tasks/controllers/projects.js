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
        ret.push(SC.Object.create({ name: rec.get('name'),  icon: rec.get('icon'), tasks: rec.get('tasks') }));
      }, this);
    return SC.Object.create({ treeItemChildren: [
      SC.Object.create({ name: 'Inbox', treeItemChildren: [], treeItemIsExpanded: NO}),
      SC.Object.create({ name: 'Projects', treeItemChildren: ret, treeItemIsExpanded: YES}),
      SC.Object.create({ name: 'Futures', treeItemChildren: [], treeItemIsExpanded: NO})
      ], treeItemIsExpanded: YES });
    
  }.property('[]').cacheable()
  
  
  
}) ;
