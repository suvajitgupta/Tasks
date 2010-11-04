// ==========================================================================
// Tasks.statisticsPane
// ==========================================================================
/*globals Tasks CoreTasks sc_require Sai */
sc_require('core');


/** @static
    
  @extends SC.ModalPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.statisticsPane = SCUI.ModalPane.extend({
  
  isResizable: NO,
  title: "_Statistics".loc(),
  // FIXME: [SG/JL] remove forced addition of 'icon' class in titleIcon to fix positioning problem, make statisticsPane a page like importDataPage
  titleIcon: 'icon statistics-icon',
  titleBarHeight: 40,
  layout: { centerX: 0, centerY: 0, height: 300, width: 650 },
  classNames: ['statistics-pane'],
  
  contentView: SC.View.design({
    
    childViews: 'statisticsTabs closeButton'.w(),
    
    statisticsTabs: SC.TabView.design({
  		layout: { top: 10, left: 10, right: 10, bottom: 40 },
      nowShowing: 'Tasks.graphicalStatisticsPage.mainView', 
      items: [
        { title: "_Graphical".loc(), value: 'Tasks.graphicalStatisticsPage.mainView' },
        { title: "_Numerical".loc(), value: 'Tasks.numericalStatisticsPage.mainView' }
      ],
      itemTitleKey: 'title',
      itemValueKey: 'value'
    }),
    
    closeButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 10, width: 80, height: 24 },
      isDefault: YES,
      title: "_Close".loc(),
      target: 'Tasks.statisticsController',
      action: 'closePanel'
    })
        
  })
  
});