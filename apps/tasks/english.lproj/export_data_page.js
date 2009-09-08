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
    layout: { centerX: 0, centerY: -60, height: 450, width: 750 },
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: [
        SC.TextFieldView.design({
          layout: { top: 10, left: 10, right: 10, bottom: 40 },
          valueBinding: SC.Binding.oneWay('Tasks.exportDataController.data'),
          // isEnabled: NO, // TODO: [SG] uncomment this line if exported data can be copied to clipboard
          isTextArea: YES
        }),
        SC.ButtonView.design({
          layout: { width: 80, height: 30, right: 10, bottom: 8 },
          titleMinWidth: 0,
          theme: 'capsule',
          title: "_Close".loc(),
          target: 'Tasks.exportDataController',
          action: 'closePanel'
        })
      ]
    })
  })
  
});