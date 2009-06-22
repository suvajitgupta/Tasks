// ==========================================================================
// Project:   Tasks.projectController
// ==========================================================================
/*globals Tasks */

/** @class

  (Document Your Controller Here)

  @extends SC.ObjectController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.projectController = SC.ObjectController.create(
/** @scope Tasks.projectController.prototype */ {
  
  contentBinding: 'Tasks.projectsTreeController.selection'

});
