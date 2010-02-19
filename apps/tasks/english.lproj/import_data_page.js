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
  
  panel: SC.PanelPane.create({
    
    layout: { centerX: 0, centerY: 0, height: 450, width: 750 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'titlebar sample format dataEntry createMissingUsersCheckbox importButton cancelButton'.w(),
      
      titlebar: SC.View.design(SC.Border, {
        layout: { left: 10, right: 10, top: 10, height: 35 },
        classNames: ['toolbar'],
        childViews: [
          SC.LabelView.design({
            layout: { centerY: 0, height: 20, centerX: 0, width: 80 },
            value: "_Import".loc(),
            classNames: ['window-title']
          })
        ]
      }),
      
      sample: SC.LabelView.design({
        escapeHTML: NO,
        layout: { top: 50, left: 10, height: 40, width: 260 },
        value: "_ImportInstructions:".loc()
      }),
      
      format: SC.LabelView.design({
        escapeHTML: NO,
        layout: { top: 50, width: 470, height: 45, right: 10 },
        classNames: [ 'onscreen-help'],
        value: Tasks.softwareMode? "_FormatOnscreenHelpSoftwareMode".loc() : "_FormatOnscreenHelpTodoMode".loc()
      }),

      dataEntry: SC.TextFieldView.design({
        layout: { top: 95, left: 10, right: 10, bottom: 40 },
        isTextArea: YES,
        valueBinding: 'Tasks.importDataController.importData'
      }),
      
      createMissingUsersCheckbox: SC.CheckboxView.design(SCUI.ToolTip, {
        layout: { width: 175, height: 22, left: 10, bottom: 8 },
        isEnabledBinding: 'CoreTasks.permissions.canCreateUser',
        title: "_CreateMissingUsers".loc(),
        toolTip: "_CreateMissingUsersTooltip".loc(),
        valueBinding: 'Tasks.importDataController.createMissingUsers',
        classNames: [ 'task-priority-high' ]
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