// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  // FIXME: [SC] this class is needed only because SC.View doesn't render tooltips
  A label with a tooltip.
  
  @extends SC.LabelView
  @author Suvajit Gupta
*/

Tasks.TitleView = SC.LabelView.extend(
/** @scope Tasks.TitleView.prototype */ {
  
  render: function(context, firstTime) {
    var toolTip = this.get('toolTip');
    if(toolTip) {
      context.attr('title', toolTip);
      context.attr('alt', toolTip);
    }
    return sc_super();
  }
  
});
