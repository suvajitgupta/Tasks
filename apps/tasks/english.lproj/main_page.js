// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI */

sc_require('core');
sc_require('mixins/localized_label');
sc_require('views/summary');

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
      
        SC.LabelView.design(SCUI.ToolTip, {
          layout: { centerY: -2, height: 26, left: 6, width: 89 },
          toolTip: "_Credits".loc(),
          classNames: ['tasks-logo']
        }),
      
        SC.LabelView.design({
          layout: { centerY: -6, height: 24, left: 100, width: 50 },
          classNames: ['tasks-version'],
          value: Tasks.VERSION
        }),

        SC.LabelView.design(SCUI.ToolTip, {
          layout: { centerY: 0, height: 20, centerX: -210, width: 320 },
          escapeHTML: NO,
          classNames: ['user-role-message']
        }),
      
        SC.View.design({
          layout: { top: 8, bottom: 8, right: 540, width: 2 },
          classNames: ['top-bar-divider']
        }),

        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 475, height: 24, width: 60 },
          icon: ['save-icon'],
          classNames: ['title-bar-label'],
          value:  "_Save".loc(),
          toolTip: "_SaveTooltip".loc(),
          isEnabledBinding: 'CoreTasks.needsSave',
          target: 'Tasks',
          action: 'saveData'
        }),
    
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 390, height: 24, width: 80 },
          icon: ['refresh-icon'],
          classNames: ['title-bar-label'],
          value:  "_Refresh".loc(),
          toolTip: "_RefreshTooltip".loc(),
          target: 'Tasks',
          action: 'refreshData'
        }),

        SC.View.design({
          layout: { top: 8, bottom: 8, right: 383, width: 2 },
          classNames: ['top-bar-divider']
        }),
        
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 310, height: 24, width: 70 },
          icon: ['import-icon'],
          classNames: ['title-bar-label'],
          title:  "_Import".loc(),
          toolTip: "_ImportTooltip".loc(),
          value:  "_Import".loc(),
          isEnabledBinding: 'CoreTasks.permissions.canImportData',
          target: 'Tasks',
          action: 'importData'
        }),

        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 240, height: 24, width: 70 },
          icon: ['export-icon'],
          classNames: ['title-bar-label'],
          value:  "_Export".loc(),
          toolTip: "_ExportTooltip".loc(),
          target: 'Tasks',
          action: 'exportData'
        }),
        
        SC.View.design({
          layout: { top: 8, bottom: 8, right: 230, width: 2 },
          classNames: ['top-bar-divider']
        }),

        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 150, height: 24, width: 75 },
          icon: ['settings-icon'],
          classNames: ['title-bar-label'],
          value:  "_Settings".loc(),
          toolTip: "_SettingsTooltip".loc(),
          target: 'Tasks',
          action: 'settings'
        }),
        
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 85, height: 24, width: 60 },
          icon: ['help-icon'],
          classNames: ['title-bar-label'],
          value:  "_Help".loc(),
          toolTip: "_HelpTooltip".loc(),
          target: 'Tasks',
          action: 'help'
        }),
        
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 10, height: 24, width: 75 },
          icon: ['logout-icon'],
          classNames: ['title-bar-label'],
          value:  "_Logout".loc(),
          toolTip: "_LogoutTooltip".loc(),
          target: 'Tasks',
          action: 'logout'
        })
      
      ]
    }),
    
    welcomeMessage: SC.outlet('titleBarView.childViews.2'),
    
    toolbarView: SC.View.design({
      layout: { left: 0, right: 0, top: 42, height: 36 },
      classNames: ['toolbar'],
      childViews: [
      
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, left: 0, height: 18, width: 105 },
          icon: 'add-icon',
          classNames: ['toolbar-label'],
          value: "_AddProject".loc(),
          toolTip: "_AddProjectTooltip".loc(),
          isEnabledBinding: 'CoreTasks.permissions.canAddProject',
          target: 'Tasks',
          action: 'addProject'
        }),
      
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, left: 100, height: 18, width: 105 },
          icon: 'delete-icon',
          classNames: ['toolbar-label'],
          value: "_DelProject".loc(),
          toolTip: "_DelProjectTooltip".loc(),
          isEnabledBinding: 'Tasks.projectsController.isDeletable',
          target: 'Tasks',
          action: 'deleteProject'
        }),
        
        SC.View.design({
          layout: { top: 8, bottom: 8, left: 228, width: 2 },
          classNames: ['top-bar-divider']
        }),

        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, left: 230, height: 18, width: 95 },
          icon: 'add-icon',
          classNames: ['toolbar-label'],
          value: "_AddTask".loc(),
          toolTip: "_AddTaskTooltip".loc(),
          isEnabledBinding: 'CoreTasks.permissions.canAddTask',
          target: 'Tasks',
          action: 'addTask'
        }),

        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, left: 315, height: 18, width: 90 },
          icon: 'delete-icon',
          classNames: ['toolbar-label'],
          value: "_DelTask".loc(),
          toolTip: "_DelTaskTooltip".loc(),
          isEnabledBinding: 'Tasks.tasksController.isDeletable',
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        SC.SegmentedView.design({
          layout: { centerY: 0, centerX: -40, height: 24, width: 130},
          classNames: ['toolbar-label'],
          items: [
            { title: "_DisplayModeTeam".loc(), value: Tasks.DISPLAY_MODE_TEAM },
            { title: "_DisplayModeTasks".loc(), value: Tasks.DISPLAY_MODE_TASKS }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'Tasks.assignmentsController.displayMode'
        }),

        SC.TextFieldView.design(SCUI.ToolTip, {
          layout: { centerY: 0, height: 24, right: 275, width: 200 },
          classNames: ['assignee-selection-bar'],
          hint: "_AssigneeSelectionHint".loc(),
          toolTip: "_AssigneeSelectionTooltip".loc(),
          valueBinding: 'Tasks.assignmentsController.assigneeSelection'
        }),
        
        SC.View.design({ // Assignee Selection cancel button
          layout: { centerY: 1, height: 12, right: 280, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('assigneeSelection', '');
          },
          isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.assigneeSelection').bool()
        }),
      
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 215, height: 18, width: 60 },
          displayProperties: [ 'icon' ],
          iconBinding: 'Tasks.assignmentsController.attributeFilterIcon',
          classNames: ['toolbar-label'],
          value: "_Filter".loc(),
          toolTip: "_FilterTooltip".loc(),
          target: 'Tasks',
          action: 'filterTasks'
        }),
        
        SC.TextFieldView.design(SCUI.ToolTip, {
          layout: { centerY: 0, height: 24, right: 10, width: 200 },
          classNames: ['tasks-search-bar'],
          hint: "_TasksSearchHint".loc(),
          toolTip: "_TasksSearchTooltip".loc(),
          valueBinding: 'Tasks.assignmentsController.searchFilter'
        }),
      
        SC.View.design({ // Tasks Search cancel button
          layout: { centerY: 1, height: 12, right: 15, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('searchFilter', '');
          },
          isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.searchFilter').bool()
        })
                             
      ]
    }),
    
    filterButton: SC.outlet('toolbarView.childViews.6'),

    masterDetailView: SC.View.design({
      layout: { top: 78, bottom: 71, left: 0, right: 0 },
      childViews: ['projectsMasterView', 'tasksDetailView'],
      
      projectsMasterView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 0, width: 238 },
        hasHorizontalScroller: NO,
        classNames: ['projects-pane'],

        contentView: SC.ListView.design({
          layout: { top: 0, left:0, bottom: 0, right: 0 },
          contentValueKey: 'displayName',
          contentUnreadCountKey: 'displayTimeLeft',
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
          contentUnreadCountKey: 'displayEffort',
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
          selectOnMouseDown: YES,
          target: 'Tasks.assignmentsController',
          action: 'showAssignee'
        }),
        
        // ..........................................................
        // Hot Key Code
        // TODO: [EG] move to /views shouldn't clutter up the .lproj layer
        keyDown: function(evt) {
          var ret, commandCode = evt.commandCodes();

          if(commandCode[0] === 'ctrl_s'){  //ctrl-s
            Tasks.saveData();
            ret = YES;
          }
          else if (commandCode[0] === 'ctrl_t'){  //ctrl-t
            Tasks.addTask();
            ret = YES;
          }
          else if (commandCode[0] === 'ctrl_p'){  //ctrl-p
            Tasks.addProject();
            ret = YES;
          }
          else{
            ret = this.interpretKeyEvents(evt) ;
          }
          return ret;
        }
      })
        
    }),

    projectsList: SC.outlet('masterDetailView.projectsMasterView.childViews.0.contentView'),
    tasksList: SC.outlet('masterDetailView.tasksDetailView.childViews.0.contentView'),
    
    controlBarView: SC.View.design({
      layout: { left: 0, right: 0, bottom: 20, height: 51 },
      classNames: ['control-bar'],
      childViews: [
        SC.View.design({
          layout: { centerX: 0, width: 1030, top: 0, bottom: 0 },
          childViews: [
          
            SC.LabelView.design(SCUI.ToolTip, {
              layout: { top: 3, bottom: 30, left: 10, width: 260 },
              classNames: ['task-attribute-set-title'],
              value: "_Type".loc(),
              toolTip: "_TypeTooltip".loc()
            }),

            SC.RadioView.design({
              layout: { top: 20, bottom: 6, left: 10, width: 260 },
              escapeHTML: NO,
              classNames: ['task-attribute-set'],
              items: [
                { title: CoreTasks.TASK_TYPE_FEATURE.loc() + '&nbsp;',
                  value: CoreTasks.TASK_TYPE_FEATURE, icon: 'task-icon-feature' },
                { title: CoreTasks.TASK_TYPE_BUG.loc() + '&nbsp;',
                  value: CoreTasks.TASK_TYPE_BUG, icon: 'task-icon-bug' },
                { title: CoreTasks.TASK_TYPE_OTHER.loc() + '&nbsp;',
                  value: CoreTasks.TASK_TYPE_OTHER, icon: 'task-icon-other' }
              ],
              itemTitleKey: 'title',
              itemValueKey: 'value',
              itemIconKey: 'icon',
              valueBinding: 'Tasks.tasksController.type',
              isEnabledBinding: 'Tasks.tasksController.isEditable',
              layoutDirection: SC.LAYOUT_HORIZONTAL
            }),

            SC.LabelView.design(SCUI.ToolTip, {
              layout: { top: 3, bottom: 30, left: 285, width: 195 },
              classNames: ['task-attribute-set-title'],
              value: "_Priority".loc(),
              toolTip: "_PriorityTooltip".loc()
            }),

            SC.RadioView.design({
              layout: { top: 20, bottom: 6, left: 285, width: 195 },
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
              valueBinding: 'Tasks.tasksController.priority',
              isEnabledBinding: 'Tasks.tasksController.isEditable',
              layoutDirection: SC.LAYOUT_HORIZONTAL
            }),

            SC.LabelView.design(SCUI.ToolTip, {
              layout: { top: 3, bottom: 30, left: 495, width: 265 },
              classNames: ['task-attribute-set-title'],
              value: "_Status".loc(),
              toolTip: "_StatusTooltip".loc()
            }),

            SC.RadioView.design({
              layout: { top: 20, bottom: 6, left: 495, width: 265 },
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
              valueBinding: 'Tasks.tasksController.developmentStatusWithValidation',
              isEnabledBinding: 'Tasks.tasksController.isEditable',
              layoutDirection: SC.LAYOUT_HORIZONTAL
            }),

            SC.LabelView.design(SCUI.ToolTip, {
              layout: { top: 3, bottom: 30, left: 775, width: 245 },
              classNames: ['task-attribute-set-title'],
              value: "_Validation".loc(),
              toolTip: "_ValidationTooltip".loc()
            }),

            SC.RadioView.design({
              layout: { top: 20, bottom: 6, left: 775, width: 245 },
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
              valueBinding: 'Tasks.tasksController.validation',
              isEnabledBinding: 'Tasks.tasksController.isValidatable',
              layoutDirection: SC.LAYOUT_HORIZONTAL
            })
          
          ]
        })
      ]
    }),
    
    statusBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 20, left: 0, right: 0 },
      classNames: ['status-bar'],
      childViews: ['summaryView', 'serverMessageView'],
      borderStyle: SC.BORDER_TOP,
        
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, left: 5, right: 500 },
        classNames: ['status-bar-message'],
        projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController.length'),
        tasksTreeBinding: SC.Binding.oneWay('Tasks.tasksController.content')
      }),

      serverMessageView: SC.LabelView.design({
        layout: { centerY: 0, height: 16, width: 400, right: 10 },
        classNames: ['status-bar-message'],
        textAlign: SC.ALIGN_RIGHT,
        value: ''
      })
      
    }),
    
    serverMessage: SC.outlet('statusBarView.serverMessageView')
    
  })
});
