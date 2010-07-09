// ==========================================================================
// Tasks.importDataPage
// ==========================================================================
/*globals Tasks sc_require SCUI */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Brandon Blatnick
  @author Suvajit Gupta
  
  Import Data Panel
  
*/
Tasks.importDataPage = SC.Page.create({
  
  panel: SCUI.ModalPane.create({
    
    title: "_Import".loc(),
    titleIcon: 'import-icon',
    titleBarHeight: 40,
    minHeight: 300,
    minWidth: 625,
    layout: { centerX: 0, centerY: 0, height: 500, width: 700 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'instructions sampleFormat dataEntryField createMissingUsersCheckbox importButton'.w(),
      
      instructions: SC.LabelView.design({
        escapeHTML: NO,
        layout: { top: 10, left: 10, height: 40, width: 250 },
        value: "_ImportInstructions:".loc()
      }),
      
      sampleFormat: SC.LabelView.design({
        escapeHTML: NO,
        layout: { top: 10, left: 260, height: 45, width: 425 },
        classNames: [ 'onscreen-help'],
        value: Tasks.softwareMode? "_FormatOnscreenHelpSoftwareMode".loc() : "_FormatOnscreenHelpTodoMode".loc()
      }),

      dataEntryField: SC.TextFieldView.design({
        layout: { top: 55, left: 10, right: 10, bottom: 40 },
        isTextArea: YES,
        valueBinding: 'Tasks.importDataController.importData'
      }),
      
      createMissingUsersCheckbox: SC.CheckboxView.design(SCUI.ToolTip, {
        layout: { width: 175, height: 22, left: 10, bottom: 8 },
        isEnabledBinding: 'CoreTasks.permissions.canCreateUser',
        title: "_CreateMissingUsers".loc(),
        toolTip: "_CreateMissingUsersTooltip".loc(),
        valueBinding: 'Tasks.importDataController.createMissingUsers'
      }),
      
      importButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 20, bottom: 8 },
        classNames: ['dark'],
        isEnabledBinding: SC.Binding.oneWay('Tasks.importDataController.importData').bool(),
        keyEquivalent: 'return',
        isDefault: YES,
        title: "_Import".loc(),
        target: 'Tasks.importDataController',
        action: 'parseAndLoadData'
      })
            
    }),
    
    focus: function() {
      Tasks.importDataPage.getPath('panel.contentView.dataEntryField').becomeFirstResponder();        
    }
  
  })
  
});