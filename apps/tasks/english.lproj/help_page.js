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
Tasks.helpPage = SC.Page.create({  
  
  panel: SC.PanelPane.create({
    
    layout: { centerX: 0, centerY: 0, height: 450, width: 600 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'userManager closeButton'.w(),
      
      userManager: SC.WebView.design({
        layout: { top: 10, left: 10, right: 10, bottom: 40 },
        value: static_url('help.html')
      }),
      
      closeButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        keyEquivalent: 'escape',
        isDefault: YES,
        theme: 'capsule',
        title: "_Close".loc(),
        target: 'Tasks.helpController',
        action: 'closePanel'
      })
      
    }),
    
    focus: function() {
      this.contentView.dataEntry.becomeFirstResponder();        
    }
  
  })
  
});