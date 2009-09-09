// ==========================================================================
// Tasks.importDataPage
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
    
    layout: { centerX: 0, centerY: 0, height: 450, width: 750 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'dataEntry importButton cancelButton'.w(),
      
      dataEntry: SC.TextFieldView.design({
        layout: { top: 10, left: 10, right: 10, bottom: 40 },
        valueBinding: 'Tasks.importDataController.importData',
        hint: "_ImportHint".loc(),
        isTextArea: YES
      }),
      
      importButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        theme: 'capsule',
        keyEquivalent: 'return',
        isDefault: YES,
        title: "_Import".loc(),
        target: 'Tasks.importDataController',
        action: 'parseAndLoadData'
      }),
      
      cancelButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 96, bottom: 8 },
        titleMinWidth: 0,
        keyEquivalent: 'escape',
        isCancel: YES,
        theme: 'capsule',
        title: "_Cancel".loc(),
        target: 'Tasks.importDataController',
        action: 'closePanel'
      })
      
    }),
    
    focus: function() {
      this.contentView.dataEntry.becomeFirstResponder();        
    }
  
  })
  
});