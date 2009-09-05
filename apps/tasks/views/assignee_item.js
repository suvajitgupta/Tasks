// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as groupExampleView for assignee information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.AssigneeItemView = SC.ListItemView.extend(
/** @scope Tasks.AssigneeItemView.prototype */ {
  
  render: function(context, firstTime) {
    sc_super();
    var content = this.get('content');
    if(content) {
      if(content.get('isOverloaded')) context.addClass('overloaded-assignee');
      else context.addClass('normal-assignee');
    }
  }
  
});
