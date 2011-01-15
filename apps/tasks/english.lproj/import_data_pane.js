// ==========================================================================
// Tasks.importDataPane
// ==========================================================================
/*globals Tasks sc_require SCUI */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Brandon Blatnick
  @author Suvajit Gupta
  
  Import Data Panel
  
*/
Tasks.importDataPane = SCUI.ModalPane.create({
    
  defaultResponder: 'Tasks.statechart',

  title: "_Import".loc(),
  titleIcon: 'import-icon',
  titleBarHeight: 40,
  minHeight: 300,
  minWidth: 625,
  layout: { centerX: 0, centerY: 0, height: 500, width: 700 },
  
  contentView: SC.View.design({
    childViews: 'instructions sampleFormat dataEntryField createMissingUsersCheckbox createMissingUsersHelpLabel cancelButton importButton'.w(),
    
    instructions: SC.LabelView.design({
      escapeHTML: NO,
      layout: { top: 12, left: 10, height: 40, width: 250 },
      value: "_ImportInstructions:".loc()
    }),
    
    sampleFormat: SC.LabelView.design({
      escapeHTML: NO,
      layout: { top: 7, left: 260, height: 55, width: 425 },
      classNames: [ 'onscreen-help'],
      value: Tasks.softwareMode? "_FormatOnscreenHelpSoftwareMode".loc() : "_FormatOnscreenHelpTodoMode".loc()
    }),

    dataEntryField: SC.TextFieldView.design({
      layout: { top: 60, left: 10, right: 10, bottom: 40 },
      maxLength: 1000000,
      isTextArea: YES,
      valueBinding: 'Tasks.importDataController.importData'
    }),
    
    createMissingUsersCheckbox: SC.CheckboxView.design({
      layout: { width: 175, height: 22, left: 10, bottom: 8 },
      isVisibleBinding: 'CoreTasks.permissions.canCreateUser',
      title: "_CreateMissingUsers".loc(),
      valueBinding: 'Tasks.importDataController.createMissingUsers'
    }),
    
    createMissingUsersHelpLabel: SC.LabelView.design({
      escapeHTML: NO,
      layout: { width: 250, height: 30, left: 175, bottom: 3 },
      isVisibleBinding: 'CoreTasks.permissions.canCreateUser',
      classNames: [ 'onscreen-help'],
      value: "_CreateMissingUsersOnscreenHelp".loc()
    }),
    
    cancelButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 110, bottom: 8 },
      titleMinWidth: 0,
      title: "_Cancel".loc(),
      action: 'close'
    }),

    importButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 20, bottom: 8 },
      isEnabledBinding: SC.Binding.oneWay('Tasks.importDataController.importData').bool(),
      keyEquivalent: 'return',
      isDefault: YES,
      title: "_Import".loc(),
      action: 'importData'
    })
          
  }),
  
  focus: function() {
    Tasks.importDataPane.getPath('contentView.dataEntryField').becomeFirstResponder();        
  }
  
});