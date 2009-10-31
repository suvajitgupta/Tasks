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
      SC.WebView.design({
        layout: { top: 0, left: 0, right: 0, bottom: 0 },
        value: static_url('help.html')
      })
    ]
            
  })
  
});