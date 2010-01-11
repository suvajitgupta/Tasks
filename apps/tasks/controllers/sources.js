// ==========================================================================
// Tasks.sourcesController
// ==========================================================================
/*globals Tasks */
/** 
  This is the controller for the Projects source list view
  
  @extends SC.TreeController
  @author Suvajit Gupta
*/

Tasks.sourcesController = SC.TreeController.create(
/** @scope Tasks.sourcesController.prototype */ {
  contentBinding: 'Tasks.projectsController.sources',
  allowsEmptySelection: YES,
  treeItemIsGrouped: YES
});
