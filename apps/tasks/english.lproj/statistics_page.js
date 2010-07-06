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

Tasks.statisticsPane = SCUI.ModalPane.extend({
  
  isResizable: NO,
  title: "_Statistics".loc(),
  titleIcon: 'statistics-icon',
  titleBarHeight: 40,
  layout: { centerX: 0, centerY: 0, height: Tasks.softwareMode? 220 : 190, width: 650 },
  classNames: ['statistics-pane'],
  
  contentView: SC.View.design({
    
    childViews: 'statistics closeButton'.w(),
    
    statistics: SC.LabelView.design({
      layout: { top: 10, left: 10, right: 10, bottom: 10 },
      textAlign: SC.ALIGN_CENTER,
      controlSize: SC.SMALL_CONTROL_SIZE,
      escapeHTML: NO,
      valueBinding: 'Tasks.assignmentsController.statistics'
    }),
      
    closeButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 15, width: 80, height: 24 },
      theme: 'capsule',
      classNames: ['dark'],
      isDefault: YES,
      title: "_Close".loc(),
      action: 'remove'
    })
        
  }),
  
  remove: function() {
    sc_super();
    Tasks.assignmentsController.closePanel();
  }
      
});