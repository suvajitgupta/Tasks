// ==========================================================================
// Tasks.helpPage
// ==========================================================================
/*globals Tasks sc_require */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Help Panel
  
*/

Tasks.helpPage = SC.Page.design({  
  
  layerId: 'mainPane',
  mainPane: SC.MainPane.design({
    
    childViews: [
    
      SC.View.design(SC.Border, {
        layout: { top: 0, left: 0, right: 0, height: 43 },
        classNames: ['title-bar'],
        childViews: [
        
          SC.LabelView.design(Tasks.ToolTip, {
            layout: { centerY: -2, height: 26, left: 6, width: 89 },
            toolTip: "_Credits".loc(),
            classNames: ['tasks-logo']
          }),

          SC.LabelView.design({
            layout: { centerY: -10, height: 24, left: 100, width: 50 },
            classNames: ['tasks-version'],
            value: Tasks.VERSION
          }),
          
          SC.LabelView.design({
            layout: { centerY: 0, height: 20, centerX: -60, width: 60 },
            value: "_Help".loc(),
            classNames: ['window-title']
          })
        
        ]
      }),
      
      SC.WebView.design({
        layout: { top: 43, left: 0, right: 0, bottom: 0 },
        value: static_url('help.html')
      })
    ]
            
  })
  
});