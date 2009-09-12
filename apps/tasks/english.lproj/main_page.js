// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks sc_require */
sc_require('views/welcome');
sc_require('views/summary');
sc_require('views/task_item');
/** @namespace

  This page lays out the Tasks application user interface.
  
  @extends SC.Object
  @author Suvajit Gupta
  @author Joshua Holt
*/

Tasks.mainPage = SC.Page.design({

  mainPane: SC.MainPane.design({
    
    layerId: 'mainPane',
    childViews: 'titleBarView toolbarView masterDetailView controlBarView statusBarView'.w(),
    
    titleBarView: SC.View.design(SC.Border, {
      layout: { top: 0, left: 0, right: 0, height: 43 },
      classNames: ['title-bar'],
      childViews: [
      
        SC.LabelView.design({
          layout: { centerY: -4, height: 26, left: 6, width: 89 },
          classNames: ['tasks-logo']
        }),
      
        SC.LabelView.design({
          layout: { centerY: -12, height: 20, left: 100, width: 40 },
          classNames: ['tasks-version'],
          value: Tasks.VERSION
        }),

        Tasks.WelcomeView.design({
          layout: { centerY: 0, height: 20, left: 215, width: 250 },
          classNames: ['welcome-label'],
          valueBinding: SC.Binding.oneWay('CoreTasks.user')
        }),
      
        SC.View.design({ 
          layout: { top: 0, height: 43, right: 270, width: 45 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['save-icon'],
              value:  "_Save".loc(),
              toolTip: "_SaveTooltip".loc(),
              target: 'Tasks',
              action: 'saveData'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['title-bar-label'],
              value:  "_Save".loc(),
              toolTip: "_SaveTooltip".loc(),
              target: 'Tasks',
              action: 'saveData'
            })
          ]
        }),
    
        SC.View.design({
          layout: { centerY: 0, height: 43, right: 220, width: 45 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['import-icon'],
              title:  "_Import".loc(),
              toolTip: "_ImportTooltip".loc(),
              target: 'Tasks',
              action: 'importData'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['title-bar-label'],
              title:  "_Import".loc(),
              toolTip: "_ImportTooltip".loc(),
              value:  "_Import".loc(),
              target: 'Tasks',
              action: 'importData'
            })
          ]
        }),

        SC.View.design({
          layout: { centerY: 0, height: 43, right: 170, width: 45 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['export-icon'],
              value:  "_Export".loc(),
              toolTip: "_ExportTooltip".loc(),
              target: 'Tasks',
              action: 'exportData'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['title-bar-label'],
              value:  "_Export".loc(),
              toolTip: "_ExportTooltip".loc(),
              target: 'Tasks',
              action: 'exportData'
            })
          ]
        }),
        
        SC.SeparatorView.design({
          layout: { top: 5, bottom: 5, right: 155,  width: 4 },
          layoutDirection: SC.LAYOUT_VERTICAL,
          classNames: ['title-bar-divider']
        }),

        SC.View.design({
          layout: { top: 0, height: 43, right: 95,  width: 50 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['settings-icon'],
              value:  "_Settings".loc(),
              toolTip: "_SettingsTooltip".loc(),
              target: 'Tasks',
              action: 'settings'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['title-bar-label'],
              value:  "_Settings".loc(),
              toolTip: "_SettingsTooltip".loc(),
              target: 'Tasks',
              action: 'settings'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 50, width: 45 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['help-icon'],
              title:  "_Help".loc(),
              toolTip: "_HelpTooltip".loc(),
              target: 'Tasks',
              action: 'help'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['title-bar-label'],
              value:  "_Help".loc(),
              toolTip: "_HelpTooltip".loc(),
              target: 'Tasks',
              action: 'help'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 5, width: 45 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['logout-icon'],
              title:  "_Logout".loc(),
              toolTip: "_LogoutTooltip".loc(),
              target: 'Tasks',
              action: 'logout'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['title-bar-label'],
              value:  "_Logout".loc(),
              toolTip: "_LogoutTooltip".loc(),
              target: 'Tasks',
              action: 'logout'
            })
          ]
      })
      
      ]
    }),
    
    toolbarView: SC.View.design({
      layout: { left: 0, right: 0, top: 43, height: 36 },
      classNames: ['toolbar'],
      childViews: [
        
        SC.LabelView.design(Tasks.SimpleButton,{
          layout: { centerY: 0, left: 15, height: 24, width: 90 },
          icon: 'project-add-icon',
          value: "_AddProject".loc(),
          classNames: ['toolbar-label'],
          toolTip: "_AddProjectTooltip".loc(),
          target: 'Tasks',
          action: 'addProject'
        }),
      
        SC.LabelView.design(Tasks.SimpleButton,{
          layout: { centerY: 0, left: 110, height: 24, width: 100 },
          icon: 'project-del-icon',
          value: "_DelProject".loc(),
          classNames: ['toolbar-label'],
          toolTip: "_DelProjectTooltip".loc(),
          isEnabledBinding: SC.Binding.oneWay('Tasks.projectsController.isDeletable'),
          target: 'Tasks',
          action: 'deleteProject'
        }),
        
        SC.LabelView.design(Tasks.SimpleButton,{
          layout: { centerY: 0, left: 255, height: 24, width: 90 },
          icon: 'task-add-icon',
          value: "_AddTask".loc(),
          classNames: ['toolbar-label'],
          toolTip: "_AddTaskTooltip".loc(),
          isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.isAddable'),
          target: 'Tasks',
          action: 'addTask'
        }),

        SC.LabelView.design(Tasks.SimpleButton,{
          layout: { centerY: 0, left: 345, height: 24, width: 90 },
          icon: 'task-del-icon',
          value: "_DelTask".loc(),
          classNames: ['toolbar-label'],
          toolTip: "_DelTaskTooltip".loc(),
          isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.isDeletable'),
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        SC.TextFieldView.design({
          layout: { centerY: 0, height: 24, right: 240, width: 200 },
          classNames: ['assignee-selection-bar'],
          hint: "_AssigneeSelectionHint".loc(),
          valueBinding: 'Tasks.assignmentsController.assigneeSelection'
        }),

        SC.View.design({ // Assignee Selection cancel button
          layout: { centerY: 0, height: 12, right: 245, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('assigneeSelection', '');
          },
          isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.assigneeSelection').bool()
        }),
      
        SC.TextFieldView.design({
          layout: { centerY: 0, height: 24, right: 10, width: 200 },
          classNames: ['tasks-search-bar'],
          hint: "_TasksSearchHint".loc(),
          valueBinding: 'Tasks.assignmentsController.searchFilter' // TODO: [SG] bind to searchController instead
        }),
      
        SC.View.design({ // Tasks Search cancel button
          layout: { centerY: 0, height: 12, right: 15, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('searchFilter', '');
          },
          isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.searchFilter').bool()
        })
                     
      ]
    }),

    masterDetailView: SC.View.design({
      layout: { top: 80, bottom: 71, left: 0, right: 0 },
      childViews: ['projectsMasterView', 'tasksDetailView'],
      
      projectsMasterView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 0, width: 238 },
        hasHorizontalScroller: NO,
        classNames: ['projects-pane'],

        contentView: Tasks.ProjectsListView.design({
          layout: { top: 0, left:0, bottom: 0, right: 0 },
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.projectsController.arrangedObjects',
          selectionBinding: 'Tasks.projectsController.selection',
          localize: YES,
          rowHeight: 22,
          classNames: ['projects-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          isEditable: YES,
          canEditContent: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES,
          exampleView: Tasks.ProjectItemView,
          delegate: Tasks.reallocationController
        })
      }),
      
      tasksDetailView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 238, right: 0 },
        hasHorizontalScroller: NO,
        classNames: ['tasks-pane'],

        contentView: SC.SourceListView.design({
          layout: { top: 0, bottom: 0, left: 0, right: 0 },
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          localize: YES,
          rowHeight: 22,
          classNames: ['tasks-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          isEditable: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          exampleView: Tasks.TaskItemView,
          groupExampleView: Tasks.AssigneeItemView,
          delegate: Tasks.reassignmentController,
          selectOnMouseDown: YES
        })
      })
        
    }),

    projectsList: SC.outlet('masterDetailView.projectsMasterView.childViews.0.contentView'),
    tasksList: SC.outlet('masterDetailView.tasksDetailView.childViews.0.contentView'),
    
    controlBarView: SC.View.design({
      layout: { left: 0, right: 0, bottom: 19, height: 51 },
      classNames: ['control-bar'],
      childViews: [
      
      SC.LabelView.design({
        layout: { top: 5, height: 18, left: 10, width: 235 },
        classNames: ['task-attribute-set-title'],
        value: "_Type".loc()
      }),
  
      SC.SeparatorView.design({
        layout: { centerY: -2, height: 4, left: 15, width: 245 },
        layoutDirection: SC.LAYOUT_HORIZONTAL,
        classNames: ['task-attribute-set-grouping']
      }),

      SC.RadioView.design({
        layout: { bottom: 0, height: 24, left: 20, width: 260 },
        escapeHTML: NO,
        classNames: ['task-attribute-set'],
        items: [
          { title: '<span class=task-type-feature>' + CoreTasks.TASK_TYPE_FEATURE.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_TYPE_FEATURE, icon: 'task-icon-feature' },
          { title: '<span class=task-type-bug>' + CoreTasks.TASK_TYPE_BUG.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_TYPE_BUG, icon: 'task-icon-bug' },
          { title: '<span class=task-type-bug>' + CoreTasks.TASK_TYPE_OTHER.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_TYPE_OTHER, icon: 'task-icon-other' }
        ],
        itemTitleKey: 'title',
        itemValueKey: 'value',
        itemIconKey: 'icon',
        valueBinding: 'Tasks.taskController.type',
        isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
        layoutDirection: SC.LAYOUT_HORIZONTAL
      }),

      SC.LabelView.design({
        layout: { top: 5, height: 18, left: 282, width: 180 },
        classNames: ['task-attribute-set-title'],
        value: "_Priority".loc()
      }),
    
      SC.SeparatorView.design({
        layout: { centerY: -2, height: 4, left: 287, width: 180 },
        layoutDirection: SC.LAYOUT_HORIZONTAL,
        classNames: ['task-attribute-set-grouping']
      }),

      SC.RadioView.design({
        layout: { bottom: 0, height: 24, left: 292, width: 200 },
        escapeHTML: NO,
        classNames: ['task-attribute-set'],
        items: [
          { title: '<span class=task-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_PRIORITY_HIGH },
          { title: '<span class=task-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_PRIORITY_MEDIUM },
          { title: '<span class=task-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_PRIORITY_LOW }
        ],
        itemTitleKey: 'title',
        itemValueKey: 'value',
        valueBinding: 'Tasks.taskController.priority',
        isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
        layoutDirection: SC.LAYOUT_HORIZONTAL
      }),

      SC.LabelView.design({
        layout: { top: 5, height: 18, left: 490, width: 240 },
        classNames: ['task-attribute-set-title'],
        value: "_Status".loc()
      }),
    
      SC.SeparatorView.design({
        layout: { centerY: -2, height: 4, left: 495, width: 250 },
        layoutDirection: SC.LAYOUT_HORIZONTAL,
        classNames: ['task-attribute-set-grouping']
      }),

      SC.RadioView.design({
        layout: { bottom: 0, height: 24, left: 500, width: 270 },
        escapeHTML: NO,
        classNames: ['task-attribute-set'],
        items: [
          { title: '<span class=task-status-planned>' + CoreTasks.TASK_STATUS_PLANNED.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_STATUS_PLANNED },
          { title: '<span class=task-status-active>' + CoreTasks.TASK_STATUS_ACTIVE.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_STATUS_ACTIVE },
          { title: '<span class=task-status-done>' + CoreTasks.TASK_STATUS_DONE.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_STATUS_DONE },
          { title: '<span class=task-status-risky>' + CoreTasks.TASK_STATUS_RISKY.loc() + '</span>&nbsp;',
            value: CoreTasks.TASK_STATUS_RISKY }
        ],
        itemTitleKey: 'title',
        itemValueKey: 'value',
        valueBinding: 'Tasks.taskController.status',
        isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
        layoutDirection: SC.LAYOUT_HORIZONTAL
      }),

      SC.LabelView.design({
        layout: { top: 5, height: 18, left: 770, width: 220 },
        classNames: ['task-attribute-set-title'],
        value: "_Validation".loc()
      }),

      SC.SeparatorView.design({
        layout: { centerY: -2, height: 4, left: 775, width: 225 },
        layoutDirection: SC.LAYOUT_HORIZONTAL,
        classNames: ['task-attribute-set-grouping']
      }),

      SC.RadioView.design({
        layout: { bottom: 0, height: 24, left: 780, width: 250 },
        escapeHTML: NO,
        classNames: ['task-attribute-set'],
        items: [
          { title: '<span class=task-validation-untested><label>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</label></span>&nbsp;',
            value: CoreTasks.TASK_VALIDATION_UNTESTED },
          { title: '<span class=task-validation-passed><label>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</label></span>&nbsp;',
            value: CoreTasks.TASK_VALIDATION_PASSED },
          { title: '<span class=task-validation-failed><label>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</label></span>&nbsp;',
            value: CoreTasks.TASK_VALIDATION_FAILED }
        ],
        itemTitleKey: 'title',
        itemValueKey: 'value',
        valueBinding: 'Tasks.taskController.validation',
        isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
        layoutDirection: SC.LAYOUT_HORIZONTAL
      })
      
      ]
    }),
    
    statusBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 18, left: 0, right: 0 },
      classNames: ['status-bar'],
      childViews: ['summaryView', 'serverMessageView'],
      borderStyle: SC.BORDER_TOP,
        
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, left: 5, right: 500 },
        classNames: ['status-bar-label'],
        projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController.length'),
        tasksCountBinding: SC.Binding.oneWay('Tasks.assignmentsController.length')
      }),

      serverMessageView: SC.LabelView.design({
        layout: { centerY: 0, height: 16, width: 400, right: 10 },
        classNames: ['status-bar-label'],
        textAlign: SC.ALIGN_RIGHT,
        value: ''
      })
      
    }),
    
    serverMessage: SC.outlet('statusBarView.serverMessageView')
    
  })
});
