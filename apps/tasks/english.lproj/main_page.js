// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI */

sc_require('core');
sc_require('mixins/localized_label');
sc_require('views/logo');
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
      
        SC.LabelView.design({
          layout: { left: 5, width: 200, centerY: 0, height: 42 },
          classNames: ['installation-logo']
        }),

        Tasks.LogoView.design({
          layout: { left: 175, width: 150, centerY: 0, height: 42 }
        }),

        SC.LabelView.design(SCUI.ToolTip, {
          layout: { centerY: -8, height: 18, centerX: -35, width: 225 },
          escapeHTML: NO,
          valueBinding: SC.Binding.transform(function(value, binding) {
            if(!value) return '';
            return "_User:".loc() + '<b>' + value + '</b>';
          }).from('CoreTasks*currentUser.name'),
          classNames: ['user-attribute-message']
        }),
        SC.LabelView.design({
          layout: { centerY: 8, height: 18, centerX: -35, width: 225 },
          escapeHTML: NO,
          valueBinding: SC.Binding.transform(function(value, binding) {
            if(!value) return '';
            return "_Role:".loc() + ' <i>' + value.loc() + '</i>';
          }).from('CoreTasks*currentUser.role'),
          classNames: ['user-attribute-message']
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 325, height: 32, width: 70 },
          icon: ['save-icon'],
          toolTip: "_SaveTooltip".loc(),
          isEnabledBinding: 'CoreTasks.needsSave',
          isVisibleBinding: SC.Binding.transform(function(value, binding) {
                                                   return !value;
                                                 }).from('Tasks.autoSave'),
          target: 'Tasks',
          action: 'saveData'
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 270, height: 32, width: 70 },
          classNames: ['refresh-icon'],
          toolTip: "_RefreshTooltip".loc(),
          target: 'Tasks',
          action: 'refreshData'
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 220, height: 32, width: 70 },
          icon: ['import-icon'],
          toolTip: "_ImportTooltip".loc(),
          target: 'Tasks',
          action: 'importData'
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 170, height: 32, width: 70 },
          classNames: ['export-icon'],
          toolTip: "_ExportTooltip".loc(),
          target: 'Tasks.exportDataController',
          action: 'selectExportDataFormat'
        }),
        
        SC.View.design({
          layout: { top: 8, bottom: 8, right: 170, width: 2 },
          classNames: ['top-bar-divider']
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 100, height: 32, width: 70 },
          classNames: ['settings-icon'],
          toolTip: "_SettingsTooltip".loc(),
          target: 'Tasks',
          action: 'settings'
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 50, height: 32, width: 70 },
          classNames: ['help-icon'],
          toolTip: "_HelpTooltip".loc(),
          target: 'Tasks',
          action: 'help'
        }),
        
        SC.LabelView.design( SCUI.SimpleButton, {
          layout: { centerY: 0, right: 0, height: 32, width: 70 },
          classNames: ['logout-icon'],
          toolTip: "_LogoutTooltip".loc(),
          target: 'Tasks',
          action: 'logout'
        })
        
      ]
    }),
    
    userNameMessage: SC.outlet('titleBarView.childViews.2'),
    userRoleMessage: SC.outlet('titleBarView.childViews.3'),
    exportButton: SC.outlet('titleBarView.childViews.7'),
    
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
          layout: { centerY: 0, left: 100, height: 18, width: 115 },
          icon: 'delete-icon',
          classNames: ['toolbar-label'],
          value: "_DeleteProject".loc(),
          toolTip: "_DeleteProjectTooltip".loc(),
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
          isEnabledBinding: 'Tasks.tasksController.isAddable',
          target: 'Tasks',
          action: 'addTask'
        }),

        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, left: 315, height: 18, width: 100 },
          icon: 'delete-icon',
          classNames: ['toolbar-label'],
          value: "_DeleteTask".loc(),
          toolTip: "_DeleteTaskTooltip".loc(),
          isEnabledBinding: 'Tasks.tasksController.isDeletable',
          target: 'Tasks',
          action: 'deleteTask'
        }),
        
        SC.SegmentedView.design(SCUI.ToolTip, {
          layout: { centerY: 0, centerX: -35, height: 24, width: 130},
          classNames: ['toolbar-label'],
          items: [
            { title: "_Tasks".loc(), value: Tasks.DISPLAY_MODE_TASKS },
            { title: "_Team".loc(), value: Tasks.DISPLAY_MODE_TEAM }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          toolTip: "_DisplayModeTooltip".loc(),
          valueBinding: 'Tasks.assignmentsController.displayMode'
        }),

        SC.TextFieldView.design(SCUI.ToolTip, {
          layout: { centerY: 0, height: 24, right: 275, width: 200 },
          classNames: ['assignee-selection-bar'],
          hint: "_UserSelectionHint".loc(),
          toolTip: "_UserSelectionTooltip".loc(),
          valueBinding: 'Tasks.assignmentsController.userSelection'
        }),
        
        SC.View.design({ // Assignee Selection cancel button
          layout: { centerY: 1, height: 12, right: 280, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.assignmentsController.set('userSelection', '');
          },
          isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.userSelection').bool()
        }),
      
        SC.LabelView.design(SCUI.SimpleButton,{
          layout: { centerY: 0, right: 215, height: 18, width: 60 },
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

        contentView: Tasks.SourceListView.design({
          layout: { top: 0, left:0, bottom: 0, right: 0 },
          contentValueKey: 'displayName',
          contentUnreadCountKey: 'displayTimeLeft',
          contentBinding: 'Tasks.sourcesController.arrangedObjects',
          selectionBinding: 'Tasks.projectsController.selection',
          localize: YES,
          rowHeight: 24,
          classNames: ['projects-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          exampleView: Tasks.ProjectItemView,
          isEditable: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          delegate: Tasks.reallocationController,
          
          render: function(context, firstTime) {
            // console.log('DEBUG-ON: Projects Master render(), editorPoppedUp=' + Tasks.editorPoppedUp);
            if(Tasks.loginTime) return;
            sc_super();
          }
          
        })
      }),
      
      tasksDetailView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 238, right: 0 },
        hasHorizontalScroller: NO,
        classNames: ['tasks-pane'],

        contentView: Tasks.SourceListView.design({
          layout: { top: 0, bottom: 0, left: 0, right: 0 },
          contentValueKey: 'displayName',
          contentUnreadCountKey: 'displayEffort',
          contentBinding: 'Tasks.tasksController.arrangedObjects',
          selectionBinding: 'Tasks.tasksController.selection',
          localize: YES,
          rowHeight: 24,
          classNames: ['tasks-pane-inner'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          exampleView: Tasks.TaskItemView,
          groupExampleView: Tasks.AssigneeItemView,
          isEditable: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          delegate: Tasks.reassignmentController,
          selectOnMouseDown: YES,
          
          /* Helper image display logic:
              No projects selected - "select project" helper
            	Single project selected:
            	  if project has no tasks:
            		  addTask enabled - "add tasks tasks" helper
              		else - "display mode" helper
              	else project has tasks
          		    if no tasks filtering through - "adjust filter" helper
            	Multiple projects selected
            		if projects have tasks:
            		  if no tasks filtering through - "adjust filter" helper
        	*/
          render: function(context, firstTime) {
          	
            // console.log('DEBUG-ON: Tasks Detail render(), editorPoppedUp=' + Tasks.editorPoppedUp);
            if(Tasks.loginTime) return;
            var sel = Tasks.projectsController.getPath('selection');
            var selectedProjectsCount = sel? sel.get('length') : 0;
            if(selectedProjectsCount === 0) { // No projects selected
              context.addClass('select-project-helper');
              return;
            }
            else if(selectedProjectsCount === 1) { // Single project selected
              if(sel.getPath('firstObject.tasks.length') === 0) { // Project has no tasks
                if(Tasks.tasksController.isAddable()) context.addClass('add-tasks-helper');
                else context.addClass('display-mode-helper');
                return;
              }
              else { // Project has tasks
                if(this.getPath('content.length') === 0) { // No tasks filtering through
                  context.addClass('adjust-filter-helper');
                  return;
                }
              }
            }
            else { // Multiple projects selected
              var tasksCount = 0;
              var ctx = {};
              for (var i = 0; i < selectedProjectsCount; i++) {
                var project = sel.nextObject(i, null, ctx);
                tasksCount += project.getPath('tasks.length');
              }
              if(tasksCount > 0) { // Projects have tasks
                if(this.getPath('content.length') === 0) { // No tasks filtering through
                  context.addClass('adjust-filter-helper');
                  return;
                }
              }
            }
            
            // Remove helper images (if any) and render tasks
            context.removeClass('add-tasks-helper');
            context.removeClass('display-mode-helper');
            context.removeClass('adjust-filter-helper');
            sc_super();
          }
                    
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
          else if (commandCode[0] === 'ctrl_d'){  //ctrl-d
            Tasks.duplicateTask();
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
      childViews: ['summaryView', 'statisticsButton', 'serverMessageView', 'autoSaveCheckbox'],
      borderStyle: SC.BORDER_TOP,
        
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, left: 5, width: 400 },
        classNames: ['status-bar-label'],
        projectsCountBinding: SC.Binding.oneWay('Tasks.projectsController.length'),
        tasksTreeBinding: SC.Binding.oneWay('Tasks.tasksController.content')
      }),
        
      statisticsButton: SC.LabelView.design( SCUI.SimpleButton, {
        layout: { centerY: 0, height: 16, centerX: -30, width: 90 },
        titleMinWidth: 0,
        classNames: ['status-bar-button'],
        value: "_ShowStatistics".loc(),
        icon: 'statistics-icon',
        toolTip: "_ShowStatisticsTooltip".loc(),
        isEnabledBinding: SC.Binding.oneWay('Tasks.tasksController*arrangedObjects.length').bool(),
        target: 'Tasks',
        action: 'projectStatistics'
      }),
      
      serverMessageView: SC.LabelView.design({
        layout: { centerY: 0, height: 16, right: 95, width: 400 },
        classNames: ['status-bar-label'],
        textAlign: SC.ALIGN_RIGHT,
        value: ''
      }),
      
      autoSaveCheckbox: SC.CheckboxView.design(SCUI.ToolTip, {
        layout: { centerY: 0, height: 16, right: 5, width: 80 },
        classNames: ['status-bar-label'],
        textAlign: SC.ALIGN_RIGHT,
        title: "_AutoSave".loc(),
        toolTip: "_AutoSaveTooltip".loc(),
        valueBinding: 'Tasks.autoSave'
      })
      
    }),
    
    serverMessage: SC.outlet('statusBarView.serverMessageView')
    
  })
});
