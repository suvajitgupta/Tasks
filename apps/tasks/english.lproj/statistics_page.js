// ==========================================================================
// Tasks.statisticsPane
// ==========================================================================
/*globals Tasks CoreTasks sc_require */
sc_require('core');


/** @static
    
  @extends SC.PanelPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.statisticsPane = SC.PanelPane.create({  
  
  layout: { centerX: 0, centerY: 0, height: 230, width: 575 },
  classNames: ['statistics-pane'],
  
  contentView: SC.View.design({
    
    layout: { top: 0, left: 0, bottom: 0, right: 0 },
    childViews: 'titlebar statistics closeButton'.w(),
    
    titlebar: SC.View.design(SC.Border, {
      layout: { left: 10, right: 10, top: 10, height: 35 },
      classNames: ['toolbar'],
      childViews: [
        SC.LabelView.design({
          layout: { centerY: 0, height: 20, centerX: 0, width: 200 },
          value: "_Statistics".loc(),
          classNames: ['window-title']
        })
      ]
    }),
    
    statistics: SC.LabelView.design({
      layout: { top: 50, left: 10, right: 10, bottom: 40 },
      textAlign: SC.ALIGN_CENTER,
      escapeHTML: NO,
      valueBinding: 'Tasks.assignmentsController.statistics'
    }),
    
    closeButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 10, bottom: 8 },
      titleMinWidth: 0,
      keyEquivalent: 'return',
      isDefault: YES,
      theme: 'capsule',
      title: "_Close".loc(),
      target: 'Tasks.assignmentsController',
      action: 'closePanel'
    })
    
  })
      
});