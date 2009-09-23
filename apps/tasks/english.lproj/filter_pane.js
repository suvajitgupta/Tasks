// ==========================================================================
// Tasks.filterPane
// ==========================================================================
/*globals Tasks CoreTasks sc_require */
sc_require('core');
sc_require('views/title');

/** @static
    
  @extends SC.SheetPane
  @author Suvajit Gupta
  
  Filter Panel
  
*/

// FIXME: [SC] SC.CheckboxView doesn't implement textAlign or icon properties
Tasks.filterPane = SC.SheetPane.create({  
  
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
        classNames: ['task-attribute-set'],
        childViews: [
          SC.CheckboxView.design({
            layout: { left: 5, top: 4, width: 55 },
            title: CoreTasks.TASK_TYPE_FEATURE.loc(),
            valueBinding: 'Tasks.assignmentsController.attributeFilterFeature',
            icon: 'task-icon-feature'
          }),
          SC.CheckboxView.design({
            layout: { centerX: 0, top: 4, width: 40 },
            title: CoreTasks.TASK_TYPE_BUG.loc(),
            valueBinding: 'Tasks.assignmentsController.attributeFilterBug',
            icon: 'task-icon-bug'
          }),
          SC.CheckboxView.design({
            layout: { right: 5, top: 4, width: 50 },
            title: CoreTasks.TASK_TYPE_OTHER.loc(),
            valueBinding: 'Tasks.assignmentsController.attributeFilterOther',
            icon: 'task-icon-other'
          })
        ]
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
        childViews: [
          SC.CheckboxView.design({
            layout: { left: 5, top: 4, width: 45 },
            title: CoreTasks.TASK_PRIORITY_HIGH.loc(),
            classNames: [ 'task-priority-high' ],
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { centerX: 0, top: 4, width: 60 },
            title: CoreTasks.TASK_PRIORITY_MEDIUM.loc(),
            classNames: [ 'task-priority-medium' ],
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { right: 5, top: 4, width: 40 },
            title: CoreTasks.TASK_PRIORITY_LOW.loc(),
            classNames: [ 'task-priority-low' ],
            value: YES
          })
        ]
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
        childViews: [
          SC.CheckboxView.design({
            layout: { left: 5, top: 4, width: 60 },
            title: CoreTasks.TASK_STATUS_PLANNED.loc(),
            classNames: [ 'task-status-planned' ],
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { centerX: -25, top: 4, width: 50 },
            title: CoreTasks.TASK_STATUS_ACTIVE.loc(),
            classNames: [ 'task-status-active' ],
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { centerX: 40, top: 4, width: 50 },
            title: CoreTasks.TASK_STATUS_DONE.loc(),
            classNames: [ 'task-status-done' ],
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { right: 5, top: 4, width: 50 },
            title: CoreTasks.TASK_STATUS_RISKY.loc(),
            classNames: [ 'task-status-risky' ],
            value: YES
          })
        ]
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
        childViews: [
          SC.CheckboxView.design({
            layout: { left: 5, top: 4, width: 65 },
            escapeHTML: NO,
            title: '<span class=task-validation-untested><label>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</label></span>',
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { centerX: 0, top: 4, width: 55 },
            escapeHTML: NO,
            title: '<span class=task-validation-passed><label>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</label></span>',
            value: YES
          }),
          SC.CheckboxView.design({
            layout: { right: 5, top: 4, width: 50 },
            escapeHTML: NO,
            title: '<span class=task-validation-failed><label>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</label></span>',
            value: YES
          })
        ]
      }),

      SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        keyEquivalent: 'escape',
        isDefault: YES,
        theme: 'capsule',
        title: "_Close".loc(),
        target: 'Tasks.filterController',
        action: 'closePane'
      })
    
    ]
    
  })
  
});