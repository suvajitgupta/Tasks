// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals Tasks SCUI */

/** 

  Display Tasks logo and version.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.LogoView = SC.View.extend(
/** @scope Tasks.LogoView.prototype */ {
  
  childViews: 'tasksLabel versionLabel'.w(),
  
  tasksLabel: SC.LabelView.design(SCUI.ToolTip, {
    layout: { centerY: 0, height: 27, left: 0, width: 71 },
    toolTip: "_Credits".loc(),
    classNames: ['tasks-logo'],
    // TODO: [SG] remove when SCUI.ToolTip works with SC master (new rendering subsystem)
    render: function() {
      sc_super();
    }
  }),

  versionLabel: SC.LabelView.design({
    layout: { centerY: -3, height: 11, left: 72, width: 30 },
    classNames: ['tasks-version'],
    value: Tasks.VERSION  
  })

});