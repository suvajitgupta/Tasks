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
          layout: { centerY: -2, height: 26, left: 6, width: 89 },
          classNames: ['tasks-logo']
        }),
      
        SC.LabelView.design({
          layout: { centerY: -6, height: 15, left: 100, width: 30 },
          classNames: ['tasks-version'],
          value: Tasks.VERSION
        }),

        Tasks.WelcomeView.design({
          layout: { centerY: 2, height: 30, left: 140, width: 95 },
          classNames: ['welcome-label'],
          valueBinding: SC.Binding.oneWay('CoreTasks.user')
        }),
      
        SC.ButtonView.design({
          layout: { centerY: 0, height: 24, left: 265, width: 50 },
          title: "_User:".loc(),
          titleMinWidth: 0,
          toolTip: "_OpenUserManagerTooltip".loc(),
          target: 'Tasks',
          action: 'openUserManager'
        }),

        SC.SelectFieldView.design({
          layout: { centerY: 0, height: 24, left: 320, width: 150 },
          nameKey: 'loginName',
          emptyName: "_Everyone".loc(), // FIXME: [SC] fix empty line after first item in SelectFieldView
          // FIXME: [SC] make SelectFieldView work with objects in controller:'Tasks.assigneeController.content',
          objects: CoreTasks.User.FIXTURES.sort(function(a,b) {
            if (a===b) return 0;
            return (a > b) ? -1 : 1 ;
          }),
          valueBinding: 'Tasks.assignmentsController.assigneeSelection' // TODO: [SG] bind to assigneeController instead
        }),

        SC.TextFieldView.design({
          layout: { centerY: -1, height: 24, left: 485, width: 200 },
          classNames: ['searchbar'],
          hint: "_SearchHint".loc(),
          valueBinding: 'Tasks.assignmentsController.searchFilter' // TODO: [SG] bind to searchController instead
        }),
      
        SC.View.design({ // Search Filter delete button
          layout: { left: 666, width: 12, centerY: 0, height: 12 },
          isVisible: NO,
          classNames: ['searchbar-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('searchFilter', '');
          },
        
          _deleteSearchFilterEnabler: function() {
            this.set('isVisible', Tasks.assignmentsController.get('searchFilter') !== '');
          }.observes('Tasks.assignmentsController.searchFilter')
        
        }),
      
        SC.View.design({
          layout: { top: 0, height: 43, left: 700, width: 40 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: -5, top: 2, width: 24, height: 24 },
              classNames: ['import-icon'],
              title:  "_Import".loc(),
              toolTip: "_ImportTooltip".loc(),
              target: 'Tasks',
              action: 'importData'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerX: 0, width: 40, height: 19, top: 22 },
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
          layout: { top: 0, height: 43, left: 750, width: 40 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: -5, top: 2, width: 24, height: 24 },
              classNames: ['export-icon'],
              value:  "_Export".loc(),
              toolTip: "_ExportTooltip".loc(),
              target: 'Tasks',
              action: 'exportData'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerX: 0, width: 40, height: 19, top: 22 },
              classNames: ['dock-label'],
              value:  "_Export".loc(),
              toolTip: "_ExportTooltip".loc(),
              target: 'Tasks',
              action: 'exportData'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, left: 800, width: 40 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: -8, top: 2, width: 24, height: 24 },
              classNames: ['save-icon'],
              value:  "_Save".loc(),
              // TODO: [SG] add isEnabledBinding to track changes
              toolTip: "_SaveTooltip".loc(),
              target: 'Tasks',
              action: 'saveData'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerX: 0, width: 40, height: 19, top: 22 },
              classNames: ['dock-label'],
              value:  "_Save".loc(),
              // TODO: [SG] add isEnabledBinding to track changes
              toolTip: "_SaveTooltip".loc(),
              target: 'Tasks',
              action: 'saveData'
            })
          ]
        }),
    
        SC.View.design({
          layout: {  top: 0, height: 43, right: 176, width: 2 },
          classNames: ['top-bar-divider']
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 116,  width: 40 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: 0, top: 2, width: 24, height: 24 },
              classNames: ['settings-icon'],
              value:  "_Settings".loc(),
              toolTip: 'Manage Tasks settings',
              target: 'Tasks',
              action: 'launchSettings'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerX: 0, width: 40, height: 19, top: 22 },
              classNames: ['dock-label'],
              value:  "_Settings".loc(),
              toolTip: 'Manage Tasks settings',
              target: 'Tasks',
              action: 'launchSettings'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 60, width: 40 },
          childViews: [
            SC.View.design(Tasks.SimpleButton,{
              layout: { centerX: -3, top: 2, width: 24, height: 24 },
              classNames: ['help-icon'],
              title:  "_Help".loc(),
              toolTip: 'Launch Tasks help',
              target: 'Tasks',
              action: 'showHelp'
            }),

            SC.LabelView.design(Tasks.SimpleButton,{
              layout: { centerX: 0, width: 30, height: 19, top: 22 },
              classNames: ['dock-label'],
              value:  "_Help".loc(),
              toolTip: 'Launch Tasks help',
              target: 'Tasks',
              action: 'showHelp'
            })
          ]
        }),
    
        SC.View.design({
          layout: { top: 0, height: 43, right: 10, width: 40 },
          childViews: [
          SC.View.design(Tasks.SimpleButton,{
            layout: { centerX: -2, top: 2, width: 24, height: 24 },
            classNames: ['logout-icon'],
            title:  "_Logout".loc(),
            toolTip: 'Logout from Tasks',
            target: 'Tasks',
            action: 'exit'
          }),

          SC.LabelView.design(Tasks.SimpleButton,{
            layout: { centerX: 0, width: 40, height: 19, top: 22 },
            classNames: ['dock-label'],
            value:  "_Logout".loc(),
            toolTip: 'Logout from Tasks',
            target: 'Tasks',
            action: 'exit'
          })
        ]
      })
      
      ]
    }),
    
    workspaceView: SC.View.design({
      layout: { top: 42, bottom: 26, left: 0, right: 0 },
      classNames: ['workspace'],
      childViews: 'topLeftView projectsControlView controlDividerView bottomRightView tasksControlView'.w(),
      
      topLeftView: SC.ScrollView.design({
        layout: { top: 0, bottom: 34, left: 0, width: 268 },
        hasHorizontalScroller: NO,
        classNames: ['projects-pane'],

        contentView: SC.ListView.design({
          layout: {top: 6 },
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
            layout: { centerY: 3, left: 16, height: 21, width: 100 },
            icon: 'project-add-icon',
            fontWeight: SC.BOLD_WEIGHT,
            value: "_AddProject".loc(),
            toolTip: 'Add a new project',
            target: 'Tasks',
            action: 'addProject'
          }),
        
          SC.LabelView.design(Tasks.SimpleButton,{
            layout: { centerY: 3, left: 126, height: 21, width: 100 },
            icon: 'project-del-icon',
            fontWeight: SC.BOLD_WEIGHT,
            value: "_DelProject".loc(),
            toolTip: 'Delete selected project',
            target: 'Tasks',
            action: 'deleteProject'
          })
             
        ]
      }),
      
      controlDividerView: SC.View.design({
        layout: { bottom: 0, height: 34, width: 5, left: 254 },
        classNames: ['control-divider']
      }),
      
      bottomRightView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 268 },
        hasHorizontalScroller: NO,
        classNames: ['tasks-pane'],

        contentView: SC.SourceListView.design({
          layout: { top: 0, bottom: 0, left: 6, right: 12 },
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          localize: YES,
          rowHeight: 40,
          classNames: ['tasks-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          isEditable: YES,
          canEditContent: true,
          canReorderContent: true,
          canDeleteContent: true,
          destroyOnRemoval: YES,
          exampleView: Tasks.TaskItemView,
          delegate: Tasks.reassignmentController
        })
      }),
      
      tasksControlView: SC.View.design({
        layout: { bottom: 0, height: 34, left: 259 },
        classNames: ['tasks-control'],
        childViews: [
        
        SC.View.design({
          layout: { top: 0, left: 0, bottom: 0, right: 0 },
          childViews: [
          
          SC.LabelView.design(Tasks.SimpleButton,{
            layout: { centerY: 1, left: 16, height: 22, width: 90 },
            icon: 'task-add-icon',
            fontWeight: SC.BOLD_WEIGHT,
            value: "_AddTask".loc(),
            toolTip: 'Add a new task, to the same assignee if there is a selected task',
            target: 'Tasks',
            action: 'addTask'
          }),

          SC.LabelView.design(Tasks.SimpleButton,{
            layout: { centerY: 1, left: 106, height: 22, width: 90 },
            icon: 'task-del-icon',
            fontWeight: SC.BOLD_WEIGHT,
            value: "_DelTask".loc(),
            toolTip: 'Delete selected task',
            target: 'Tasks',
            action: 'deleteTask'
          }),
          
          SC.View.design({
            layout: { left: 130, right: 0 },
            childViews: [
            
          SC.SeparatorView.design({
            layoutDirection: SC.LAYOUT_VERTICAL,
            layout: { top: 5, bottom: 5, left: 80, width: 4 }
          }),

          SC.RadioView.design({
            layout: { centerY: 3, height: 21, left: 95, width: 180 },
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
            layout: { top: 5, bottom: 5, left: 275, width: 4 }
          }),

          SC.RadioView.design({
            layout: { centerY: 3, height: 21, left: 290, width: 250 },
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
            layout: { top: 5, bottom: 5, left: 535, width: 4 }
          }),

          SC.RadioView.design({
            layout: { centerY: 3, height: 21, left: 550, width: 210 },
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

    projectsList: SC.outlet('workspaceView.topLeftView.childViews.0.contentView'),
    tasksList: SC.outlet('workspaceView.bottomRightView.childViews.0.contentView'),
    
    bottomBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 26, left: 0, right: 0 },
      classNames: ['bottom-bar'],
      childViews: 'summaryView'.w(),
      borderStyle: SC.BORDER_TOP,
        
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, left: 6, height: 16, width: 800 },
        valueBinding: SC.Binding.oneWay('Tasks.assignmentsController.length')
      })    
    })
  })
});
