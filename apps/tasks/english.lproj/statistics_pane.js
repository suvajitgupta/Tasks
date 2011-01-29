// ==========================================================================
// Tasks.statisticsPane
// ==========================================================================
/*globals Tasks CoreTasks sc_require Sai */
sc_require('core');
sc_require('views/graphical_statistics');
sc_require('views/numerical_statistics');


/** @static
    
  @extends SC.ModalPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.statisticsPane = SCUI.ModalPane.create({
  
  isResizable: NO,
  title: "_Statistics".loc(),
  titleIcon: 'statistics-icon',
  titleBarHeight: 40,
  layout: { centerX: 0, centerY: 0, height: 300, width: 650 },
  classNames: ['statistics-pane'],
  
  contentView: SC.View.design({
    
    childViews: 'statisticsTabs closeButton'.w(),
    
    statisticsTabs: SC.TabView.design({
  		layout: { top: 10, left: 10, right: 10, bottom: 40 },
      nowShowing: 'Tasks.graphicalStatisticsView', 
      items: [
        { title: "_Graphical".loc(), value: 'Tasks.graphicalStatisticsView' },
        { title: "_Numerical".loc(), value: 'Tasks.numericalStatisticsView' }
      ],
      itemTitleKey: 'title',
      itemValueKey: 'value'
    }),
    
    closeButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 10, width: 80, height: 24 },
      isDefault: YES,
      title: "_Close".loc(),
      action: 'close'
    })
        
  })
  
});