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
  
  childViews: 'logoIcon versionLabel'.w(),
  
  logoIcon: SC.LabelView.design(SCUI.ToolTip, {
    layout: { centerY: 0, height: 27, left: 0, width: 71 },
    toolTip: "_Credits".loc(),
    classNames: ['tasks-logo']
  }),

  versionLabel: SC.LabelView.design({
    layout: { centerY: -3, height: 11, left: 72, width: 25 },
    classNames: ['tasks-version'],
    value: Tasks.VERSION  
  })

});