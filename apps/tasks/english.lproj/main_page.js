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
    
    childViews: 'dockView workspaceView bottomBarView'.w(),
    
    dockView: SC.View.design(SC.Border, {
      layout: { top: 0, left: 0, right: 0, height: 43 },
      classNames: ['top-bar'],
      childViews: [
      
        SC.LabelView.design({
          layout: { centerY: -4, height: 26, left: 6, width: 89 },
          classNames: ['tasks-logo']
        }),
      
        SC.LabelView.design({
          layout: { centerY: -12, height: 15, left: 100, width: 30 },
          classNames: ['tasks-version'],
          value: Tasks.VERSION
        }),

        Tasks.WelcomeView.design({
          layout: { centerY: 0, height: 30, left: 145, width: 95 },
          classNames: ['welcome-label'],
          valueBinding: SC.Binding.oneWay('CoreTasks.user')
        }),
      
        SC.TextFieldView.design({
          layout: { centerY: -2, height: 24, left: 270, width: 200 },
          classNames: ['assignee-selection-bar'],
          hint: "_AssigneeSelectionHint".loc(),
          valueBinding: 'Tasks.assignmentsController.assigneeSelection'
        }),

        SC.View.design({ // Assignee Selection cancel button
          layout: { centerY: -2, height: 12, left: 450, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('assigneeSelection', '');
          },
        
          _assigneeSelectionCancelButtonEnabler: function() {
            this.set('isVisible', Tasks.assignmentsController.get('assigneeSelection') !== '');
          }.observes('Tasks.assignmentsController.assigneeSelection')
        
        }),
      
        SC.TextFieldView.design({
          layout: { centerY: -2, height: 24, left: 510, width: 200 },
          classNames: ['tasks-search-bar'],
          hint: "_TasksSearchHint".loc(),
          valueBinding: 'Tasks.assignmentsController.searchFilter' // TODO: [SG] bind to searchController instead
        }),
      
        SC.View.design({ // Tasks Search cancel button
          layout: { centerY: -2, height: 12, left: 690, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('searchFilter', '');
          },
        
          _tasksSearchCancelButtonEnabler: function() {
            this.set('isVisible', Tasks.assignmentsController.get('searchFilter') !== '');
          }.observes('Tasks.assignmentsController.searchFilter')
        
        }),
      
        SC.View.design({
          layout: {  top: 0, height: 43, right: 375, width: 2 },
          classNames: ['top-bar-divider']
        }),
    
        SC.View.design({ // TODO: [SG] add isEnabledBinding to track changes
          layout: { top: 0, height: 43, right: 320, width: 45 },
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
              classNames: ['dock-label'],
              value:  "_Save".loc(),
              toolTip: "_SaveTooltip".loc(),
              target: 'Tasks',
              action: 'saveData'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 265, width: 45 },
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
              classNames: ['dock-label'],
              title:  "_Import".loc(),
              toolTip: "_ImportTooltip".loc(),
              value:  "_Import".loc(),
              target: 'Tasks',
              action: 'importData'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 205, width: 45 },
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
              classNames: ['dock-label'],
              value:  "_Export".loc(),
              toolTip: "_ExportTooltip".loc(),
              target: 'Tasks',
              action: 'exportData'
            })
          ]
        }),
    
        SC.View.design({
          layout: {  top: 0, height: 43, right: 185, width: 2 },
          classNames: ['top-bar-divider']
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 122,  width: 50 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['settings-icon'],
              value:  "_Settings".loc(),
              toolTip: "_SettingsTooltip".loc(),
              target: 'Tasks',
              action: 'openSettings'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['dock-label'],
              value:  "_Settings".loc(),
              toolTip: "_SettingsTooltip".loc(),
              target: 'Tasks',
              action: 'launchSettings'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 65, width: 45 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['help-icon'],
              title:  "_Help".loc(),
              toolTip: "_HelpTooltip".loc(),
              target: 'Tasks',
              action: 'showHelp'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { left: 0, right: 0, height: 19, top: 22 },
              classNames: ['dock-label'],
              value:  "_Help".loc(),
              toolTip: "_HelpTooltip".loc(),
              target: 'Tasks',
              action: 'showHelp'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 10, width: 45 },
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
            classNames: ['dock-label'],
            value:  "_Logout".loc(),
            toolTip: "_LogoutTooltip".loc(),
            target: 'Tasks',
            action: 'logout'
          })
        ]
      })
      
      ]
    }),
    
    workspaceView: SC.View.design({
      layout: { top: 42, bottom: 26, left: 0, right: 0 },
      classNames: ['workspace'],
      childViews: 'projectsListView projectsControlView controlDividerView taskListView tasksControlView'.w(),
      
      projectsListView: SC.ScrollView.design({
        layout: { top: 0, bottom: 35, left: 0, width: 268 },
        hasHorizontalScroller: NO,
        classNames: ['projects-pane'],

        contentView: Tasks.ProjectsListView.design({
          layout: { top: 5 },
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.projectsController.arrangedObjects',
          selectionBinding: 'Tasks.projectsController.selection',
          localize: YES,
          rowHeight: 23,
          classNames: ['projects-pane-inner'],
          hasContentIcon: YES,
          contentIconKey:  'icon',
          isEditable: YES,
          canEditContent: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES,
          delegate: Tasks.reallocationController
        })
      }),
      
      projectsControlView: SC.View.design({
        layout: { bottom: 0, height: 34, width: 254 },
        classNames: ['projects-control'],
        childViews: [
          
          SC.LabelView.design(Tasks.SimpleButton,{
            layout: { centerY: 3, left: 10, height: 24, width: 115 },
            icon: 'project-add-icon',
            value: "_AddProject".loc(),
            classNames: ['bottom-bar-label'],
            toolTip: "_AddProjectTooltip".loc(),
            target: 'Tasks',
            action: 'addProject'
          }),
        
          SC.LabelView.design(Tasks.SimpleButton,{
            layout: { centerY: 3, left: 125, height: 24, width: 115 },
            icon: 'project-del-icon',
            value: "_DelProject".loc(),
            classNames: ['bottom-bar-label'],
            toolTip: "_DelProjectTooltip".loc(),
            isEnabledBinding: SC.Binding.oneWay('Tasks.projectsController.isDeletable'),
            target: 'Tasks',
            action: 'deleteProject'
          })
             
        ]
      }),
      
      controlDividerView: SC.View.design({
        layout: { bottom: 0, height: 34, width: 5, left: 254 },
        classNames: ['control-divider']
      }),
      
      taskListView: SC.ScrollView.design({
        layout: { top: 0, bottom: 35, left: 268 },
        hasHorizontalScroller: NO,
        classNames: ['tasks-pane'],

        contentView: SC.SourceListView.design({
          layout: { top: 0, bottom: 0, left: 6, right: 6 },
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          localize: YES,
          rowHeight: 25,
          classNames: ['tasks-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          isEditable: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          exampleView: Tasks.TaskItemView,
          delegate: Tasks.reassignmentController,
          selectOnMouseDown: YES
        })
      }),
      
      tasksControlView: SC.View.design({ // FIXME: [SG] not setting to disabled when switching to another project and no task is selected
        layout: { bottom: 0, height: 34, left: 259 },
        classNames: ['tasks-control'],
        childViews: [
        
          SC.View.design({
            layout: { top: 0, left: 0, bottom: 0, right: 0 },
            childViews: [
          
            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerY: 3, left: 15, height: 24, width: 90 },
              icon: 'task-add-icon',
              value: "_AddTask".loc(),
              classNames: ['bottom-bar-label'],
              toolTip: "_AddTaskTooltip".loc(),
              target: 'Tasks',
              action: 'addTask'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerY: 3, left: 106, height: 24, width: 90 },
              icon: 'task-del-icon',
              value: "_DelTask".loc(),
              classNames: ['bottom-bar-label'],
              toolTip: "_DelTaskTooltip".loc(),
              isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
              target: 'Tasks',
              action: 'deleteTask'
            }),
          
            SC.View.design({
              layout: { top: 0, left: 195, right: 0 },
              childViews: [
            
              SC.SeparatorView.design({
                layoutDirection: SC.LAYOUT_VERTICAL,
                layout: { top: 5, bottom: 5, left: 0, width: 4 }
              }),

              SC.RadioView.design({
                layout: { centerY: 3, height: 21, left: 20, width: 200 },
                escapeHTML: NO,
                controlSize: SC.SMALL_CONTROL_SIZE,
                items: [
                  { title: '<span class=tasks-priority-high>' + CoreTasks.TASK_PRIORITY_HIGH.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_PRIORITY_HIGH },
                  { title: '<span class=tasks-priority-medium>' + CoreTasks.TASK_PRIORITY_MEDIUM.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_PRIORITY_MEDIUM },
                  { title: '<span class=tasks-priority-low>' + CoreTasks.TASK_PRIORITY_LOW.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_PRIORITY_LOW }
                ],
                itemTitleKey: 'title',
                itemValueKey: 'value',
                valueBinding: 'Tasks.taskController.priority',
                isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
                layoutDirection: SC.LAYOUT_HORIZONTAL
              }),

              SC.SeparatorView.design({
                layoutDirection: SC.LAYOUT_VERTICAL,
                layout: { top: 5, bottom: 5, left: 205, width: 4 }
              }),

              SC.RadioView.design({
                layout: { centerY: 3, height: 21, left: 230, width: 270 },
                escapeHTML: NO,
                controlSize: SC.SMALL_CONTROL_SIZE,
                items: [
                  { title: '<span class=tasks-status-planned>' + CoreTasks.TASK_STATUS_PLANNED.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_STATUS_PLANNED },
                  { title: '<span class=tasks-status-active>' + CoreTasks.TASK_STATUS_ACTIVE.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_STATUS_ACTIVE },
                  { title: '<span class=tasks-status-done>' + CoreTasks.TASK_STATUS_DONE.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_STATUS_DONE },
                  { title: '<span class=tasks-status-risky>' + CoreTasks.TASK_STATUS_RISKY.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_STATUS_RISKY }
                ],
                itemTitleKey: 'title',
                itemValueKey: 'value',
                valueBinding: 'Tasks.taskController.status',
                isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
                layoutDirection: SC.LAYOUT_HORIZONTAL
              }),

              SC.SeparatorView.design({
                layoutDirection: SC.LAYOUT_VERTICAL,
                layout: { top: 5, bottom: 5, left: 490, width: 4 }
              }),

              SC.RadioView.design({
                layout: { centerY: 3, height: 21, left: 510, width: 230 },
                escapeHTML: NO,
                controlSize: SC.SMALL_CONTROL_SIZE,
                items: [
                  { title: '<span class=tasks-validation-untested>' + CoreTasks.TASK_VALIDATION_UNTESTED.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_VALIDATION_UNTESTED },
                  { title: '<span class=tasks-validation-passed>' + CoreTasks.TASK_VALIDATION_PASSED.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_VALIDATION_PASSED },
                  { title: '<span class=tasks-validation-failed>' + CoreTasks.TASK_VALIDATION_FAILED.loc() + '</span>&nbsp;',
                    value: CoreTasks.TASK_VALIDATION_FAILED }
                ],
                itemTitleKey: 'title',
                itemValueKey: 'value',
                valueBinding: 'Tasks.taskController.validation',
                isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
                layoutDirection: SC.LAYOUT_HORIZONTAL
              })
            ]
            })
          ]
          })
        ]
        })
    }),

    projectsList: SC.outlet('workspaceView.projectsListView.childViews.0.contentView'),
    tasksList: SC.outlet('workspaceView.taskListView.childViews.0.contentView'),
    
    bottomBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 26, left: 0, right: 0 },
      classNames: ['bottom-bar'],
      childViews: 'summaryView'.w(),
      borderStyle: SC.BORDER_TOP,
        
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, left: 10, right: 0 },
        projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController.length'),
        tasksCountBinding: SC.Binding.oneWay('Tasks.assignmentsController.length')
      })    
    })
  })
});
