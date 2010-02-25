// ==========================================================================
// Tasks.helpPage
// ==========================================================================
/*globals Tasks sc_require SCUI */
sc_require('core');
sc_require('main');
sc_require('views/logo');

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
        
          Tasks.LogoView.design({
            layout: { centerY: 0, height: 42, left: 0, width: 150 }
          }),
          
          SC.LabelView.design({
            layout: { centerY: 0, height: 20, centerX: -30, width: 120 },
            value: "_Help".loc(),
            classNames: ['window-title']
          })
        
        ]
      }),
      
      SC.WebView.design({
        layout: { top: 43, left: 0, right: 0, bottom: 0 },
        value: static_url('help.html') + '?softwareMode=' + Tasks.softwareMode
      })
    ]
            
  })
  
});