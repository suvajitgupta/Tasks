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
    layout: { centerY: -2, height: 26, left: 6, width: 89 },
    toolTip: "_Credits".loc(),
    classNames: ['tasks-logo']
  }),

  versionLabel: SC.LabelView.design({
    layout: { centerY: -6, height: 11, left: 95, width: 40 },
    classNames: ['tasks-version'],
    value: Tasks.VERSION
  })

});