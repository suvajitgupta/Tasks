// ==========================================================================
// Tasks.helpPage
// ==========================================================================
/*globals Tasks sc_require SCUI */
sc_require('views/logo');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Help Panel
  
*/

Tasks.helpPage = SC.Page.create({  
  
  layerId: 'mainPane',
  mainPane: SC.MainPane.design({
    
    childViews: 'titleView contentView'.w(),
    
    titleView: SC.View.design(SC.Border, {
      layout: { top: 0, left: 0, right: 0, height: 43 },
      classNames: ['title-bar'],
      childViews: 'logoView title'.w(),
      
      logoView: Tasks.LogoView.design({
        layout: { left: 5, centerY: 0, height: 42, width: 104 },
        logo: 'tasks-logo-small',
        version: Tasks.VERSION
      }),
      
      title: SC.LabelView.design({
        classNames: ['window-title'],
        layout: { centerY: 0, height: 20, centerX: -30, width: 120 },
        value: "_OnlineHelp".loc(),
        icon: 'sc-icon-help-16'
      })
      
    }),
    
    contentView: SC.WebView.design({
      classNames: ['help-view'],
      layout: { top: 53, left: 10, right: 10, bottom: 10 },
      value: Tasks.getHelpUrl()
    })
            
  })
  
});