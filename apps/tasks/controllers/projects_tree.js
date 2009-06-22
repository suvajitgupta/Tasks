// ==========================================================================
// Project:   Tasks.projectsController
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.TreeController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectsTreeController = SC.TreeController.create(
/** @scope Tasks.projectsController.prototype */ {
  
  contentBinding: 'Tasks.projectsController.nodes'
  //treeItemIsGrouped: YES
  
});
