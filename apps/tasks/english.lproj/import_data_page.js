// ==========================================================================
// Tasks.importData
// ==========================================================================
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Brandon Blatnick
  
  Import Data Panel
  
*/
Tasks.importDataPage = SC.Page.create({  
  
  panel: SC.PalettePane.create({
    layout: { right: 305, top: 15, height: 250, width: 300 },
    contentView: 
    SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: [
        SC.TextFieldView.design({
          layout: { top: 10, left: 10, right: 10, height: 200 },
          valueBinding: 'Tasks.importDataController.data',
          isTextArea: YES
        }),
        SC.ButtonView.design({
          layout: { width: 100, height: 30, right: 25, bottom: 10 },
          title: "_Import".loc(),
          target: 'Tasks.importDataController',
          action: 'importData'
        }),
        SC.ButtonView.design({
          layout: { width: 100, height: 30, left: 25, bottom: 10 },
          title: "_Cancel".loc(),
          target: 'Tasks.importDataController',
          action: 'closePanel'
        })
      ]
    })
  })
});