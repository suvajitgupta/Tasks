// ==========================================================================
// Project:   Tasks.projectsController
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.TreeController
*/
Tasks.projectsTreeController = SC.TreeController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  contentBinding: 'Tasks.projectsController.nodes',
  treeItemIsGrouped: YES
  
}) ;
