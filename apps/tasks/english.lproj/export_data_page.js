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
  
  panel: SCUI.ModalPane.create({
    
    titleBarHeight: 40,
    title: "_Export".loc(),
    minHeight: 300,
    minWidth: 625,
    layout: { centerX: 0, centerY: 0, height: 500, width: 700 },
    
    contentView: SC.View.design({
      
      childViews: 'exportField'.w(),
      
      exportField: SC.TextFieldView.design({
        layout: { left: 10, right: 10, top: 10, bottom: 10 },
        valueBinding: SC.Binding.oneWay('Tasks.exportDataController.data'),
        isTextArea: YES
      })
              
    })
  })
  
});