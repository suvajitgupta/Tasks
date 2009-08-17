// ==========================================================================
// Tasks.importData
// ==========================================================================
/*globals Tasks sc_require */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Brandon Blatnick
  @author Suvajit Gupta
  
  Import Data Panel
  
*/
Tasks.importDataPage = SC.Page.create({  
  
  panel: SC.PanelPane.create({
    layout: { centerX: 0, centerY: -60, height: 500, width: 750 },
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: [
        SC.TextFieldView.design({
          layout: { top: 10, left: 10, right: 10, bottom: 40 },
          valueBinding: 'Tasks.importDataController.data',
          hint: "_ImportHint".loc(),
          isTextArea: YES
        }),
        SC.ButtonView.design({
          layout: { width: 80, height: 30, right: 10, bottom: 8 },
          titleMinWidth: 0,
          theme: 'capsule',
          isDefault: YES,
          title: "_Import".loc(),
          target: 'Tasks.importDataController',
          action: 'importData'
        }),
        SC.ButtonView.design({
          layout: { width: 80, height: 30, right: 96, bottom: 8 },
          titleMinWidth: 0,
          theme: 'capsule',
          title: "_Cancel".loc(),
          target: 'Tasks.importDataController',
          action: 'closePanel'
        })
      ]
    })
  })
  
});