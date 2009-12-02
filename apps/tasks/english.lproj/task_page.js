// ==========================================================================
// Tasks.taskPage
// ==========================================================================
/*globals Tasks sc_require SCUI */
sc_require('core');
sc_require('views/logo');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Task Panel
  
*/

Tasks.taskPage = SC.Page.design({  
  
  layerId: 'mainPane',
  mainPane: SC.MainPane.design({
    
    childViews: [
    
      SC.View.design(SC.Border, {
        layout: { top: 0, left: 0, right: 0, height: 43 },
        classNames: ['title-bar'],
        childViews: [
        
          Tasks.LogoView.design({
            layout: { centerY: 0, height: 26, left: 0, width: 150 }
          }),

          SC.LabelView.design({
            layout: { centerY: 0, height: 20, centerX: -30, width: 120 },
            value: "_TaskDetails".loc(),
            classNames: ['window-title']
          })
        
        ]
      }),
      
      SC.View.design({
        
        layout: { top: 43, left: 0, right: 0, bottom: 0 },
        classNames: ['task-detail-pane'],
        
        childViews: [
        
          SC.LabelView.design({
            layout: { top: 10, height: 24, left: 10, right: 10 },
            valueBinding: 'Tasks.detailTaskID'
          })
        
        ]

      })
    ]
            
  })
  
});