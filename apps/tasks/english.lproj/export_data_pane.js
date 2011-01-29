// ==========================================================================
// Tasks.exportDataPane
// ==========================================================================
/*globals Tasks sc_require */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Export Data Panel
  
*/
Tasks.exportDataPane = SCUI.ModalPane.create({

  title: "_Export".loc(),
  titleIcon: 'text-icon',
  titleBarHeight: 40,
  minHeight: 300,
  minWidth: 625,
  layout: { centerX: 0, centerY: 0, height: 500, width: 700 },
  
  contentView: SC.View.design({
    
    childViews: 'exportField closeButton'.w(),
    
    exportField: SC.TextFieldView.design({
      layout: { left: 10, right: 10, top: 10, bottom: 40 },
      valueBinding: SC.Binding.oneWay('Tasks.exportDataController.data'),
      maxLength: 1000000,
      isTextArea: YES
    }),
    
    closeButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 20, width: 80, height: 24 },
      keyEquivalent: 'return',
      isDefault: YES,
      title: "_Close".loc(),
      action: 'close'
    })
            
  })
  
});