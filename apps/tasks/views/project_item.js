// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.ProjectItemView = SC.ListItemView.extend(
/** @scope Tasks.ProjectItemView.prototype */ {
  
  // FIXME: [SG] remove this after CollectionView localization is added back
  renderLabel: function(context, label) {
    context.push('<label>', label? label.loc() : '', '</label>') ;
  }
  
});
