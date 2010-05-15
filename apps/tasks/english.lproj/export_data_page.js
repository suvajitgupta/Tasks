// ==========================================================================
// Tasks.exportDataPage
// ==========================================================================
/*globals Tasks sc_require */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Export Data Panel
  
*/
Tasks.exportDataPage = SC.Page.create({  
  
  panel: SC.PanelPane.create({
    
    layout: { centerX: 0, centerY: 0, height: 450, width: 750 },
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'titlebar exportField closeButton'.w(),
      
      titlebar: SC.View.design(SC.Border, {
        layout: { left: 10, right: 10, top: 10, height: 35 },
        classNames: ['titlebar'],
        childViews: 'title'.w(),
        title: SC.LabelView.design({
          layout: { centerY: 0, height: 20, centerX: 0, width: 80 },
          value: "_Export".loc(),
          icon: 'text-icon',
          classNames: ['window-title']
        })
      }),
    
      exportField: SC.TextFieldView.design({
        layout: { top: 45, left: 10, right: 10, bottom: 40 },
        valueBinding: SC.Binding.oneWay('Tasks.exportDataController.data'),
        isTextArea: YES
      }),
      
      closeButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        keyEquivalent: 'return',
        isDefault: YES,
        theme: 'capsule',
        title: "_Close".loc(),
        target: 'Tasks.exportDataController',
        action: 'closePanel'
      })
        
    })
  })
  
});