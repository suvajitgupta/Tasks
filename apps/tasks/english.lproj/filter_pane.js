// ==========================================================================
// Tasks.filterPane
// ==========================================================================
/*globals Tasks CoreTasks SCUI sc_require */
sc_require('core');
sc_require('main');
sc_require('views/decorated_checkbox');


/** @static
    
  @extends SC.PanelPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.filterPane = SC.PanelPane.create({  
  
  layout: { top: 78, right: 100, height: Tasks.softwareMode? 460 : 320, width: 310 },
  classNames: ['filter-pane'],
  
  contentView: SC.View.design({
    
    layout: { top: 0, left: 0, bottom: 0, right: 0 },
    childViews: 'title quickfilterToolbar typeLabel typeCheckboxes priorityLabel priorityCheckboxes statusLabel statusCheckboxes validationLabel validationCheckboxes effortSpecifiedLabel effortSpecifiedSegments recentlyUpdatedLabel recentlyUpdatedSegments closeButton applyButton'.w(),
    
    title: SC.LabelView.design({
      layout: { top: 10, left: 10, right: 10, height: 24 },
      classNames: ['task-attribute-set-title'],
      value: "_QuickFilters".loc(),
      toolTip: "_QuickFiltersTooltip".loc()
    }),
    
    quickfilterToolbar: SC.View.design({

      layout: { top: 28, left: 5, height: Tasks.softwareMode? 70 : 35, right: 5 },
      classNames: ['quickfilter-toolbar'],
      childViews: 'allButton troubledButton unfinishedButton unvalidatedButton verifiedButton showstoppersButton'.w(),
  
      allButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, left: 5, top: 7 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'all'],
        title: "_All".loc(),
        toolTip: "_AllTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'clearAttributeFilter'
      }),
  
      troubledButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, centerX: -5, top: 7 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'troubled'],
        title: "_Troubled".loc(),
        toolTip: "_TroubledTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterTroubled'
      }),
  
      unfinishedButton: SC.ButtonView.design({
        layout: { width: 100, height: 30, right: 5, top: 7 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'unfinished'],
        title: "_Unfinished".loc(),
        toolTip: "_UnfinishedTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterUnfinished'
      }),
  
      unvalidatedButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, left: 5, top: 39 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'unvalidated'],
        isVisible: Tasks.softwareMode,
        title: "_Unvalidated".loc(),
        toolTip: "_UnvalidatedTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterUnvalidated'
      }),
  
      verifiedButton: SC.ButtonView.design({
        layout: { width: 90, height: 30, centerX: -5, top: 39 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'verified'],
        isVisible: Tasks.softwareMode,
        title: "_Verified".loc(),
        toolTip: "_VerifiedTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterVerified'
      }),
  
      showstoppersButton: SC.ButtonView.design({
        layout: { width: 100, height: 30, right: 5, top: 39 },
        titleMinWidth: 0,
        classNames: ['quickfilter-label', 'showstoppers'],
        isVisible: Tasks.softwareMode,
        title: "_Showstoppers".loc(),
        toolTip: "_ShowstoppersTooltip".loc(),
        target: 'Tasks.assignmentsController',
        action: 'setAttributeFilterShowstoppers'
      })
               
    }),
    
    typeLabel: SC.LabelView.design({
      layout: { top: 110, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set-title'],
      isVisible: Tasks.softwareMode,
      value: "_Type".loc(),
      toolTip: "_TypeTooltip".loc()
    }),

    typeCheckboxes: SC.View.design({
      layout: { top: 127, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set', 'checkbox-icon'],
      isVisible: Tasks.softwareMode,
      displayProperties: [ 'feature', 'bug', 'other' ],
      childViews: 'feature bug other'.w(),
      
      feature: Tasks.DecoratedCheckboxView.design({
        layout: { left: 5, top: 4, width: 85 },
        icon: 'task-icon-feature',
        title: CoreTasks.TASK_TYPE_FEATURE.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterTypeFeature'
      }),
      
      bug: Tasks.DecoratedCheckboxView.design({
        layout: { centerX: 0, top: 4, width: 65 },
        icon: 'task-icon-bug',
        title: CoreTasks.TASK_TYPE_BUG.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterTypeBug'
      }),
      
      other: Tasks.DecoratedCheckboxView.design({
        layout: { right: 5, top: 4, width: 75 },
        icon: 'task-icon-other',
        title: CoreTasks.TASK_TYPE_OTHER.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterTypeOther'
      })

    }),

    priorityLabel: SC.LabelView.design({
      layout: { top: Tasks.softwareMode? 165 : 75, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set-title'],
      value: "_Priority".loc(),
      toolTip: "_PriorityTooltip".loc()
    }),

    priorityCheckboxes: SC.View.design({
      layout: { top: Tasks.softwareMode? 183 : 92, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set'],
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
      layout: { top: Tasks.softwareMode? 220 : 135, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set-title'],
      value: "_Status".loc(),
      toolTip: "_StatusTooltip".loc()
    }),

    statusCheckboxes: SC.View.design({
      layout: { top: Tasks.softwareMode? 237 : 152, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set'],
      displayProperties: [ 'planned', 'active', 'done', 'risky' ],
      childViews: 'planned active done risky'.w(),
      
      planned: SC.CheckboxView.design({
        layout: { left: 5, top: 4, width: 65 },
        title: CoreTasks.TASK_STATUS_PLANNED.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusPlanned',
        classNames: [ 'task-status-planned' ]
      }),
      
      active: SC.CheckboxView.design({
        layout: { centerX: -25, top: 4, width: 55 },
        title: CoreTasks.TASK_STATUS_ACTIVE.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusActive',
        classNames: [ 'task-status-active' ]
      }),
      
      done: SC.CheckboxView.design({
        layout: { centerX: 45, top: 4, width: 50 },
        title: CoreTasks.TASK_STATUS_DONE.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusDone',
        classNames: [ 'task-status-done' ]
      }),
      
      risky: SC.CheckboxView.design({
        layout: { right: 5, top: 4, width: 50 },
        title: CoreTasks.TASK_STATUS_RISKY.loc(),
        valueBinding: 'Tasks.assignmentsController.attributeFilterStatusRisky',
        classNames: [ 'task-status-risky' ]
      })

    }),

    validationLabel: SC.LabelView.design({
      layout: { top: 275, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set-title'],
      isVisible: Tasks.softwareMode,
      value: "_Validation".loc(),
      toolTip: "_ValidationTooltip".loc()
    }),

    validationCheckboxes: SC.View.design({
      layout: { top: 292, height: 24, left: 10, right: 10 },
      classNames: ['task-attribute-set'],
      isVisible: Tasks.softwareMode,
      displayProperties: [ 'untested', 'passed', 'failed' ],
      childViews: 'untested passed failed'.w(),
      
      untested: SC.CheckboxView.design({
        layout: { left: 5, top: 3, width: 75 },
        escapeHTML: NO,
        title: '<span class=task-validation-untested><label>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</label></span>',
        isEnabledBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterStatusDone'),
        valueBinding: 'Tasks.assignmentsController.attributeFilterValidationUntested'
      }),
      
      passed: SC.CheckboxView.design({
        layout: { centerX: 0, top: 3, width: 65 },
        escapeHTML: NO,
        title: '<span class=task-validation-passed><label>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</label></span>',
        isEnabledBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterStatusDone'),
        valueBinding: 'Tasks.assignmentsController.attributeFilterValidationPassed'
      }),
      
      failed: SC.CheckboxView.design({
        layout: { right: 5, top: 3, width: 60 },
        escapeHTML: NO,
        title: '<span class=task-validation-failed><label>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</label></span>',
        isEnabledBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterStatusDone'),
        valueBinding: 'Tasks.assignmentsController.attributeFilterValidationFailed'
      })

    }),

    effortSpecifiedLabel: SC.LabelView.design({
      layout: { bottom: 90, height: 22, left: 15, width: 95 },
      classNames: ['filter-label'],
      textAlign: SC.ALIGN_RIGHT,
      value: "_EffortSpecified:".loc()
    }),

    effortSpecifiedSegments: SC.SegmentedView.design(SCUI.ToolTip, {
      layout: { bottom: 92, height: 24, left: 100, right: 10 },
      classNames: ['filter-label'],
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
      layout: { bottom: 55, height: 22, left: 15, width: 95 },
      classNames: ['filter-label'],
      textAlign: SC.ALIGN_RIGHT,
      value: "_RecentlyUpdated:".loc()
    }),

    recentlyUpdatedSegments: SC.SegmentedView.design(SCUI.ToolTip, {
      layout: { bottom: 57, height: 24, left: 100, right: 10 },
      classNames: ['filter-label'],
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
      titleMinWidth: 0,
      theme: 'capsule',
      title: "_Cancel".loc(),
      target: 'Tasks.filterController',
      action: 'closePane'
    }),
    
    applyButton: SC.ButtonView.design({
      layout: { width: 80, height: 30, right: 10, bottom: 8 },
      titleMinWidth: 0,
      keyEquivalent: 'return',
      isDefault: YES,
      theme: 'capsule',
      title: "_Apply".loc(),
      target: 'Tasks.filterController',
      action: 'applyFilter'
    })
        
  })
  
});