// ==========================================================================
// Tasks.filterPane
// ==========================================================================
/*globals Tasks CoreTasks SCUI sc_require */
sc_require('core');

/** @static
    
  @extends SC.PanelPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.filterPane = SC.SheetPane.create({  
  
  layout: { centerX: 0, height: Tasks.softwareMode? 460 : 355, width: 310 },
  classNames: ['filter-pane'],
  
  contentView: SC.View.design({
    
    layout: { top: 0, left: 0, bottom: 0, right: 0 },
    childViews: 'title quickfilterToolbar typeLabel typeCheckboxes priorityLabel priorityCheckboxes statusLabel statusCheckboxes validationLabel validationCheckboxes effortSpecifiedLabel effortSpecifiedRadiobuttons recentlyUpdatedLabel recentlyUpdatedRadiobuttons closeButton applyButton'.w(),
    
    title: SC.LabelView.design({
      layout: { top: 10, centerX: 0, width: 150, height: 24 },
      textAlign: SC.ALIGN_CENTER,
      value: "_QuickFilters".loc(),
      toolTip: "_QuickFiltersTooltip".loc()
    }),
    
    quickfilterToolbar: SC.View.design({

      layout: { top: 28, left: 5, height: 70, right: 5 },
      classNames: ['item-group'],
      childViews: 'allButton troubledButton unfinishedButton unvalidatedButton completedButton showstoppersButton'.w(),
  
      allButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, left: 5, top: 7 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'all'],
        title: "_All".loc(),
        toolTip: "_AllTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'clearAttributeFilter'
      }),

      showstoppersButton: SC.ButtonView.design({
        layout: { width: 100, height: 30, centerX: 0, top: 7 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'showstoppers'],
        isVisible: Tasks.softwareMode,
        title: "_Showstoppers".loc(),
        toolTip: "_ShowstoppersTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterShowstoppers'
      }),      

      troubledButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, right: 5, top: 7 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'troubled'],
        title: "_Troubled".loc(),
        toolTip: "_TroubledTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterTroubled'
      }),
  
      unfinishedButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, left: 5, top: 39 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'unfinished'],
        title: "_Unfinished".loc(),
        toolTip: "_UnfinishedTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterUnfinished'
      }),
  
      unvalidatedButton: SC.ButtonView.design({
        layout: { width: 100, height: 30, centerX: 0, top: 39 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'unvalidated'],
        isVisible: Tasks.softwareMode,
        title: "_Unvalidated".loc(),
        toolTip: "_UnvalidatedTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterUnvalidated'
      }),
  
      completedButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, right: 5, top: 39 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'completed'],
        title: "_Completed".loc(),
        toolTip: "_CompletedTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterCompleted'
      })
                     
    }),
    
    typeLabel: SC.LabelView.design({
      layout: { top: 110, height: 24, left: 10, right: 10 },
      isVisible: Tasks.softwareMode,
      value: "_Type".loc(),
      toolTip: "_TypeTooltip".loc()
    }),

    typeCheckboxes: SC.View.design({
      layout: { top: 127, height: 24, left: 10, right: 10 },
      classNames: ['item-group', 'checkbox-icon'],
      isVisible: Tasks.softwareMode,
      displayProperties: [ 'feature', 'bug', 'other' ],
      childViews: 'feature bug other'.w(),
      
      feature: SC.CheckboxView.design({
        layout: { left: 5, top: 4, width: 95 },
        icon: 'task-icon-feature',
        title: CoreTasks.TASK_TYPE_FEATURE.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterTypeFeature'
      }),
      
      bug: SC.CheckboxView.design({
        layout: { centerX: 0, top: 4, width: 75 },
        icon: 'task-icon-bug',
        title: CoreTasks.TASK_TYPE_BUG.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterTypeBug'
      }),
      
      other: SC.CheckboxView.design({
        layout: { right: 5, top: 4, width: 85 },
        icon: 'task-icon-other',
        title: CoreTasks.TASK_TYPE_OTHER.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterTypeOther'
      })

    }),

    priorityLabel: SC.LabelView.design({
      layout: { top: Tasks.softwareMode? 165 : 110, height: 24, left: 10, right: 10 },
      value: "_Priority".loc(),
      toolTip: "_PriorityTooltip".loc()
    }),

    priorityCheckboxes: SC.View.design({
      layout: { top: Tasks.softwareMode? 183 : 127, height: 24, left: 10, right: 10 },
      classNames: ['item-group'],
      displayProperties: [ 'high', 'medium', 'low' ],
      childViews: 'high medium low'.w(),
      
      high: SC.CheckboxView.design({
        layout: { left: 5, top: 4, width: 50 },
        title: CoreTasks.TASK_PRIORITY_HIGH.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterPriorityHigh',
        classNames: [ 'task-priority-high' ]
      }),
              
      medium: SC.CheckboxView.design({
        layout: { centerX: 0, top: 4, width: 65 },
        title: CoreTasks.TASK_PRIORITY_MEDIUM.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterPriorityMedium',
        classNames: [ 'task-priority-medium' ]
      }),
      
      low: SC.CheckboxView.design({
        layout: { right: 5, top: 4, width: 45 },
        title: CoreTasks.TASK_PRIORITY_LOW.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterPriorityLow',
        classNames: [ 'task-priority-low' ]
      })
      
    }),

    statusLabel: SC.LabelView.design({
      layout: { top: Tasks.softwareMode? 220 : 170, height: 24, left: 10, right: 10 },
      value: "_Status".loc(),
      toolTip: "_StatusTooltip".loc()
    }),

    statusCheckboxes: SC.View.design({
      layout: { top: Tasks.softwareMode? 237 : 187, height: 24, left: 10, right: 10 },
      classNames: ['item-group'],
      displayProperties: [ 'planned', 'active', 'done', 'risky' ],
      childViews: 'planned active done risky'.w(),
      
      planned: SC.CheckboxView.design({
        layout: { left: 5, top: 4, width: 65 },
        title: CoreTasks.STATUS_PLANNED.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusPlanned',
        classNames: [ 'status-planned' ]
      }),
      
      active: SC.CheckboxView.design({
        layout: { centerX: -25, top: 4, width: 55 },
        title: CoreTasks.STATUS_ACTIVE.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusActive',
        classNames: [ 'status-active' ]
      }),
      
      done: SC.CheckboxView.design({
        layout: { centerX: 45, top: 4, width: 50 },
        title: CoreTasks.STATUS_DONE.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusDone',
        classNames: [ 'status-done' ]
      }),
      
      risky: SC.CheckboxView.design({
        layout: { right: 5, top: 4, width: 50 },
        title: CoreTasks.STATUS_RISKY.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusRisky',
        classNames: [ 'status-risky' ]
      })

    }),

    validationLabel: SC.LabelView.design({
      layout: { top: 275, height: 24, left: 10, right: 10 },
      isVisible: Tasks.softwareMode,
      value: "_Validation".loc(),
      toolTip: "_ValidationTooltip".loc()
    }),

    validationCheckboxes: SC.View.design({
      layout: { top: 292, height: 24, left: 10, right: 10 },
      classNames: ['item-group'],
      isVisible: Tasks.softwareMode,
      displayProperties: [ 'untested', 'passed', 'failed' ],
      childViews: 'untested passed failed'.w(),
      
      untested: SC.CheckboxView.design({
        layout: { left: 5, top: 3, width: 75 },
        escapeHTML: NO,
        title: '<span class=task-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>',
        isEnabledBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterStatusDone'),
        valueBinding: 'Tasks.assignmentsController.attributeFilterValidationUntested'
      }),
      
      passed: SC.CheckboxView.design({
        layout: { centerX: 0, top: 3, width: 65 },
        escapeHTML: NO,
        title: '<span class=task-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>',
        isEnabledBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterStatusDone'),
        valueBinding: 'Tasks.assignmentsController.attributeFilterValidationPassed'
      }),
      
      failed: SC.CheckboxView.design({
        layout: { right: 5, top: 3, width: 60 },
        escapeHTML: NO,
        title: '<span class=task-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>',
        isEnabledBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterStatusDone'),
        valueBinding: 'Tasks.assignmentsController.attributeFilterValidationFailed'
      })

    }),

    effortSpecifiedLabel: SC.LabelView.design({
      layout: { bottom: 90, height: 22, left: 0, width: 112 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_EffortSpecified:".loc()
    }),

    effortSpecifiedRadiobuttons: SC.RadioView.design(SCUI.ToolTip, {
      layout: { bottom: 90, height: 24, left: 115, right: 10 },
      classNames: ['item-group'],
      layoutDirection: SC.LAYOUT_HORIZONTAL,
      items: [
        { title: "_DontCare".loc(), value: Tasks.FILTER_DONTCARE },
        { title: "_Yes".loc(), value: Tasks.FILTER_YES },
        { title: "_No".loc(), value: Tasks.FILTER_NO }
      ],
      itemTitleKey: 'title',
      itemValueKey: 'value',
      toolTip: "_EffortSpecifiedTooltip".loc(),
      valueBinding: 'Tasks.assignmentsController.effortSpecified'
    }),

    recentlyUpdatedLabel: SC.LabelView.design({
      layout: { bottom: 55, height: 22, left: 0, width: 112 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_RecentlyUpdated:".loc()
    }),

    recentlyUpdatedRadiobuttons: SC.RadioView.design(SCUI.ToolTip, {
      layout: { bottom: 55, height: 24, left: 115, right: 10 },
      classNames: ['item-group'],
      layoutDirection: SC.LAYOUT_HORIZONTAL,
      items: [
        { title: "_DontCare".loc(), value: Tasks.FILTER_DONTCARE },
        { title: "_Yes".loc(), value: Tasks.FILTER_YES },
        { title: "_No".loc(), value: Tasks.FILTER_NO }
      ],
      itemTitleKey: 'title',
      itemValueKey: 'value',
      toolTip: "_RecentlyUpdatedFilterTooltip".loc(),
      valueBinding: 'Tasks.assignmentsController.recentlyUpdated'
    }),

    closeButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 96, bottom: 8 },
      classNames: ['dark'],
      titleMinWidth: 0,
      title: "_Cancel".loc(),
      target: 'Tasks.filterController',
      action: 'closePane'
    }),
    
    applyButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 10, bottom: 8 },
      classNames: ['dark'],
      titleMinWidth: 0,
      keyEquivalent: 'return',
      isDefault: YES,
      title: "_Apply".loc(),
      target: 'Tasks.filterController',
      action: 'applyFilter'
    })
        
  })
  
});