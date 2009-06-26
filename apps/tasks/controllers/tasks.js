// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals Tasks */

/** 

	This is the controller for the Tasks detail list, driven by the selected Project
	
  @extends SC.TreeController
	@author Joshua Holt
	@author Suvajit Gupta
*/
Tasks.tasksController = SC.TreeController.create(
/** @scope Tasks.tasksController.prototype */ {

  contentBinding: 'Tasks.assignmentsController.assignments',
  treeItemIsGrouped: YES,

  // TODO: set selection to first item intially, later switching to selection from "last session"

	addTask: function() { // TODO: implement
		alert ('Not implemented!');
	},
	
	deleteTask: function() { // TODO: implement
		alert ('Not implemented!');
	}
	
});
