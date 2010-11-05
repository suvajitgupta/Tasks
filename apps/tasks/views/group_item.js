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
/** @scope Tasks.GroupItemView.prototype */ {
  
  touchStart: function(event) {
    this.mouseDown(event);
  },
  
  mouseDown: function(event) {
    sc_super();
    var pv = this.get('parentView');
    if (pv && pv.toggle) pv.toggle(this.get('contentIndex'));
  }
    
});