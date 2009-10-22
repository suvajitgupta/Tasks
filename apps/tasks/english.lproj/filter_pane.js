// ==========================================================================
// Tasks.filterPane
// ==========================================================================
/*globals Tasks CoreTasks sc_require */
sc_require('core');
sc_require('views/decorated_checkbox');


/** @static
    
  @extends SC.SheetPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

Tasks.filterPane = SC.PickerPane.create({  
  
  layout: { top: 78, right: 240, height: 280, width: 280 },
  
  contentView: SC.View.design({
    
    layout: { top: 0, left: 0, bottom: 0, right: 0 },
    childViews: [
    
      SC.LabelView.design({
        layout: { top: 5, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set-title'],
        value: "_Type".loc(),
        toolTip: "_TypeTooltip".loc()
      }),

      SC.View.design({
        layout: { top: 22, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set', 'checkbox-icon'],
        displayProperties: [ 'feature', 'bug', 'other' ],
        childViews: [ 'feature', 'bug', 'other' ],
        
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

      SC.LabelView.design({
        layout: { top: 65, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set-title'],
        value: "_Priority".loc(),
        toolTip: "_PriorityTooltip".loc()
      }),

      SC.View.design({
        layout: { top: 82, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set'],
        displayProperties: [ 'high', 'medium', 'low' ],
        childViews: [ 'high', 'medium', 'low' ],
        
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

      SC.LabelView.design({
        layout: { top: 125, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set-title'],
        value: "_Status".loc(),
        toolTip: "_StatusTooltip".loc()
      }),

      SC.View.design({
        layout: { top: 142, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set'],
        displayProperties: [ 'planned', 'active', 'done', 'risky' ],
        childViews: [ 'planned', 'active', 'done', 'risky' ],
        
        planned: SC.CheckboxView.design({
          layout: { left: 5, top: 4, width: 65 },
          title: CoreTasks.TASK_STATUS_PLANNED.loc(),
          valueBinding: 'Tasks.assignmentsController.attributeFilterStatusPlanned',
          classNames: [ 'task-status-planned' ]
        }),
        
        active: SC.CheckboxView.design({
          layout: { centerX: -20, top: 4, width: 55 },
          title: CoreTasks.TASK_STATUS_ACTIVE.loc(),
          valueBinding: 'Tasks.assignmentsController.attributeFilterStatusActive',
          classNames: [ 'task-status-active' ]
        }),
        
        done: SC.CheckboxView.design({
          layout: { centerX: 40, top: 4, width: 50 },
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

      SC.LabelView.design({
        layout: { top: 185, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set-title'],
        value: "_Validation".loc(),
        toolTip: "_ValidationTooltip".loc()
      }),

      SC.View.design({
        layout: { top: 202, height: 24, left: 10, right: 10 },
        classNames: ['task-attribute-set'],
        displayProperties: [ 'untested', 'passed', 'failed' ],
        childViews: [ 'untested', 'passed', 'failed' ],
        
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

      SC.ButtonView.design({
        layout: { width: 100, height: 30, right: 96, bottom: 8 },
        titleMinWidth: 0,
        theme: 'capsule',
        title: "_EnableAll".loc(),
        target: 'Tasks.assignmentsController',
        action: 'clearAttributeFilter'
      }),
      
      SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        keyEquivalent: 'escape',
        isDefault: YES,
        theme: 'capsule',
        title: "_Apply".loc(),
        target: 'Tasks.filterController',
        action: 'closePane'
      })
    
    ]
    
  })
  
});