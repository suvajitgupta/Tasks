// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals Tasks */

/** 

  Used as groupExampleView that doesn't allow disclosing.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

Tasks.UndiscloseableGroupItemView = SC.ListItemView.extend(
/** @scope Tasks.UndiscloseableGroupItemView.prototype */ {
  
  renderDisclosure: function(context, state) {
    return YES;
  }
  
});
