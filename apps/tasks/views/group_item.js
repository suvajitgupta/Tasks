// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require */

/** 

  Used as groupExampleView for to handle mouse down events and avoid context menus popping up.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.GroupItemView = SC.ListItemView.extend(
/** @scope Tasks.AssigneeItemView.prototype */ {
  
  mouseDown: function(event) {
    sc_super();
  }
    
});