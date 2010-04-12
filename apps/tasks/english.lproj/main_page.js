// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI sc_static*/

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

Tasks.actionsMenuHelper = SC.Object.create({

  displayedTasksCountBinding: SC.Binding.oneWay('Tasks.tasksController*arrangedObjects.length'),
  autoSaveBinding: SC.Binding.oneWay('CoreTasks*autoSave'),
  shouldNotifyBinding: SC.Binding.oneWay('CoreTasks*shouldNotify'),

  // TODO: [SG] Beta: add tooltips to actions menu items
  _listActions: function() {
    var ret = [];
    if(this.getPath('displayedTasksCount') > 0) {
      ret.push({ title: "_ViewStatistics".loc(), icon: 'statistics-icon', target: 'Tasks', action: 'viewStatistics', isEnabled: YES });
      ret.push({ isSeparator: YES });
    }
    ret.push({ title: "_ImportData".loc(), icon: 'import-icon', target: 'Tasks', action: 'importData', isEnabled: YES });
    ret.push({ title: "_ExportText".loc(), icon: 'text-icon', target: 'Tasks.exportDataController', action: 'exportDataAsText', isEnabled: YES });
    ret.push({ title: "_ExportHTML".loc(), icon: 'html-icon', target: 'Tasks.exportDataController', action: 'exportDataAsHTML', isEnabled: YES });
    ret.push({ isSeparator: YES });
    ret.push({ title: "_Settings".loc(), icon: 'settings-icon', target: 'Tasks', action: 'settings', isEnabled: YES });
    var autoSave = this.get('autoSave');
    ret.push({ title: (autoSave? "_Disable".loc() : "_Enable".loc()) + "_AutoSave".loc(), icon: 'save-icon', target: 'Tasks', action: 'toggleAutoSave', isEnabled: YES, checkbox: !autoSave });
    if(CoreTasks.get('canServerSendNotifications')) {
      var shouldNotify = this.get('shouldNotify');
      ret.push({ title: (shouldNotify? "_Disable".loc() : "_Enable".loc()) + "_SendNotifications".loc(), icon: 'notification-icon', target: 'Tasks', action: 'toggleShouldNotify', isEnabled: YES, checkbox: !shouldNotify });
    }
    ret.push({ isSeparator: YES });
    ret.push({ title: "_Help".loc(), icon: 'sc-icon-help-16', target: 'Tasks', action: 'help', isEnabled: YES });
    ret.push({ title: "_Logout".loc(), icon: sc_static('blank'), target: 'Tasks', action: 'logout', isEnabled: YES });
    return ret;
  }.property('displayedTasksCount', 'autoSave', 'shouldNotify').cacheable()
  
});

Tasks.mainPage = SC.Page.design({

  mainPane: SC.MainPane.design({
    
    layerId: 'mainPane',
    childViews: 'topBarView masterDetailView bottomBarView'.w(),
    
    topBarView: SC.View.design(SC.Border, {
      layout: { top: 2, left: 0, right: 0, height: 43 },
      classNames: ['title-bar'],
      childViews: 'tasksLogo userNameLabel installationLogo actionsMenu displayModeSegments userSelectionField userSelectionCancelButton filterPanelButton filterCancelButton tasksSearchField tasksSearchCancelButton'.w(),
      
      tasksLogo: Tasks.LogoView.design({
        layout: { left: 5, width: 145, top: 0, height: 24 }
      }),

      userNameLabel: SC.LabelView.design(SCUI.ToolTip, {
        layout: { bottom: 2, left: 0, width: 150, height: 16 },
        valueBinding: SC.Binding.transform(function(value, binding) {
          return value? ("_Hi".loc() + value) : '';
        }).from('CoreTasks*currentUser.name'),
        classNames: ['user-name-message']
      }),

      installationLogo: SC.View.design({
        layout: { left: 155, width: document.title.match(/Dev|Demo|Greenhouse/)? 32: 140, centerY: -1, height: 32 },
        tagName: 'img',
        render: function(context, firstTime) {
          if(document.title.match(/Dev/)) {
            context.attr('src', sc_static('images/dev-logo.jpg'));
          }
          else if(document.title.match(/Demo/)) {
            context.attr('src', sc_static('images/demo-logo.jpg'));
          }
          else if(document.title.match(/Greenhouse/)) {
            context.attr('src', sc_static('images/greenhouse-logo.png'));
          }
          else if(document.title.match(/SproutCore/)) {
            context.attr('src', sc_static('images/sproutcore-logo.png'));
          }
        }
      }),
      actionsMenu: SC.ButtonView.design(SCUI.DropDown, {
        layout: { centerY: 0, left: 320, height: 24, width: 42 },
        classNames: ['actions-menu'],
        titleMinWidth: 0,
        hasIcon: YES,
        icon: 'actions-icon',
        toolTip: "_ActionsMenuTooltip".loc(),
        dropDown: SC.MenuPane.design({
          contentView: SC.View.design({}),
          layout: { width: 175, height: 0 },
          itemTitleKey: 'title',
          itemIconKey: 'icon',
          itemTargetKey: 'target',
          itemActionKey: 'action',
          itemSeparatorKey: 'isSeparator',
          itemIsEnabledKey: 'isEnabled',
          itemCheckboxKey: 'checkbox',
          itemsBinding: SC.Binding.oneWay('Tasks.actionsMenuHelper._listActions')    
        })
      }),

      displayModeSegments: SC.SegmentedView.design(SCUI.ToolTip, {
        layout: { centerY: 0, centerX: -70, height: 24, width: 100 },
        classNames: ['display-modes'],
        items: [
          { title: "_Tasks".loc(), icon: 'tasks-icon', value: Tasks.DISPLAY_MODE_TASKS },
          { title: "_Team".loc(), icon: 'sc-icon-group-16', value: Tasks.DISPLAY_MODE_TEAM }
        ],
        itemTitleKey: 'title',
        // itemIconKey: 'icon', // disabling icons for now - appearing too cluttered
        itemValueKey: 'value',
        toolTip: "_DisplayModeTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.displayMode'
      }),

      userSelectionField: SC.TextFieldView.design(SCUI.ToolTip, {
        layout: { centerY: 0, height: 24, right: 280, width: 200 },
        classNames: ['user-selection-bar'],
        hint: "_UserSelectionHint".loc(),
        toolTip: "_UserSelectionTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.userSelection'
      }),
      userSelectionCancelButton: SC.View.design({ // Assignee/Submitter selection cancel button
        layout: { centerY: 1, height: 12, right: 285, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.set('userSelection', '');
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.userSelection').bool()
      }),
    
      filterPanelButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, right: 202, height: 18, width: 50 },
        icon: 'filter-icon',
        classNames: ['top-bar-label', 'filter-label'],
        value: "_Filter".loc(),
        toolTip: "_FilterTooltip".loc(),
        target: 'Tasks',
        action: 'filterTasks'
      }),
      filterCancelButton: SC.View.design({ // Filter cancel button
        layout: { centerY: 1, height: 12, right: 212, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.clearAttributeFilter();
          Tasks.assignmentsController.showAssignments();
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterEnabled').bool()
      }),
    
      tasksSearchField: SC.TextFieldView.design(SCUI.ToolTip, {
        layout: { centerY: 0, height: 24, right: 5, width: 200 },
        classNames: ['tasks-search-bar'],
        hint: "_TasksSearchHint".loc(),
        toolTip: "_TasksSearchTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.searchFilter'
      }),
      tasksSearchCancelButton: SC.View.design({ // Tasks Search cancel button
        layout: { centerY: 1, height: 12, right: 10, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.set('searchFilter', '');
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.searchFilter').bool()
      })
                             
    }),
    
    userName: SC.outlet('topBarView.userNameLabel'),
    
    masterDetailView: SC.View.design({
      layout: { top: 45, bottom: 24, left: 0, right: 0 },
      childViews: 'projectsMasterView tasksDetailView'.w(),
      
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
          delegate: Tasks.reallocationController                
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
          hasContentIcon: Tasks.softwareMode,
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
          	
            // console.log('DEBUG: Tasks Detail render(), editorPoppedUp=' + Tasks.editorPoppedUp);
            if(CoreTasks.loginTime) return;
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
                    
        })
        
        // ..........................................................
        // Hot Key Code - disabled for now owing to conflicts with browser shortcuts
        // keyDown: function(evt) {
        //   var ret, commandCode = evt.commandCodes();
        // 
        //   if(commandCode[0] === 'ctrl_s'){  //ctrl-s
        //     Tasks.saveData();
        //     ret = YES;
        //   }
        //   else if (commandCode[0] === 'ctrl_t'){  //ctrl-t
        //     Tasks.addTask();
        //     ret = YES;
        //   }
        //   else if (commandCode[0] === 'ctrl_d'){  //ctrl-d
        //     Tasks.duplicateTask();
        //     ret = YES;
        //   }
        //   else if (commandCode[0] === 'ctrl_p'){  //ctrl-p
        //     Tasks.addProject();
        //     ret = YES;
        //   }
        //   else{
        //     ret = this.interpretKeyEvents(evt) ;
        //   }
        //   return ret;
        // }
        
      })
        
    }),

    projectsList: SC.outlet('masterDetailView.projectsMasterView.contentView'),
    tasksList: SC.outlet('masterDetailView.tasksDetailView.contentView'),
    
    bottomBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 24, left: 0, right: 0 },
      classNames: ['bottom-bar'],
      childViews: 'addProjectButton deleteProjectButton selectionView divider addTaskButton deleteTaskButton summaryView serverMessageView refreshButton saveButton'.w(),
      borderStyle: SC.BORDER_TOP,
        
      addProjectButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, left: 7, height: 16, width: 16 },
        icon: 'add-icon',
        classNames: ['top-bar-label'],
        toolTip: "_AddProjectTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateProject',
        target: 'Tasks',
        action: 'addProject'
      }),
      deleteProjectButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, left: 33, height: 16, width: 16 },
        icon: 'delete-icon',
        classNames: ['top-bar-label'],
        toolTip: "_DeleteProjectTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteProject',
        isEnabledBinding: 'Tasks.projectsController.isDeletable',
        target: 'Tasks',
        action: 'deleteProject'
      }),
      
      selectionView: Tasks.SelectionView.design({
        layout: { centerY: 0, height: 16, left: 57, width: 220 },
        classNames: ['bottom-bar-label'],
        textAlign: SC.ALIGN_LEFT,
        projectsSelectionBinding: SC.Binding.oneWay('Tasks.projectsController.selection'),
        tasksSelectionBinding: SC.Binding.oneWay('Tasks.tasksController.selection')
      }),
        
      divider: SC.View.design({
        layout: { centerY: 0, height: 16, left: 228, width: 2 },
        classNames: ['divider']
      }),
      
      addTaskButton: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { centerY: 0, left: 237, height: 16, width: 16 },
        icon: 'add-icon',
        toolTip: "_AddTaskTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateTask',
        isEnabledBinding: 'Tasks.tasksController.isAddable',
        target: 'Tasks',
        action: 'addTask'
      }),
      deleteTaskButton: SC.LabelView.design(SCUI.SimpleButton,SCUI.Permissible,{
        layout: { centerY: 0, left: 262, height: 16, width: 16 },
        icon: 'delete-icon',
        toolTip: "_DeleteTaskTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteTask',
        isEnabledBinding: SC.Binding.logicalAnd('Tasks.tasksController.isDeletable', 'Tasks.tasksController.notGuestOrGuestSubmittedTasks'),
        isPermittedBinding: 'Tasks.tasksController.notGuestOrGuestSubmittedTasks',
        target: 'Tasks',
        action: 'deleteTask'
      }),
      
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, left: 290, width: 250 },
        classNames: ['bottom-bar-label'],
        displayModeBinding: SC.Binding.oneWay('Tasks.assignmentsController.displayMode'),
        tasksTreeBinding: SC.Binding.oneWay('Tasks.tasksController.content')
      }),
        
      serverMessageView: SC.LabelView.design({
        layout: { centerY: 0, height: 16, right: 55, width: 250 },
        classNames: ['bottom-bar-label'],
        icon: '',
        textAlign: SC.ALIGN_RIGHT,
        value: ''
      }),

      refreshButton: SC.LabelView.design( SCUI.SimpleButton, {
        layout: { centerY: 0, height: 18, right: 30, width: 18 },
        icon: 'refresh-icon',
        toolTip: "_RefreshTooltip".loc(),
        target: 'Tasks',
        action: 'refreshData'
      }),
      saveButton: SC.LabelView.design( SCUI.SimpleButton, {
        layout: { centerY: 0, height: 18, right: 7, width: 18 },
        icon: 'save-icon',
        toolTip: "_SaveTooltip".loc(),
        isEnabledBinding: 'CoreTasks.needsSave',
        isVisibleBinding: SC.Binding.transform(function(value, binding) {
                                                 return !value;
                                               }).from('CoreTasks.autoSave'),
        target: 'Tasks',
        action: 'saveData'
      })
            
    }),
    
    serverMessage: SC.outlet('bottomBarView.serverMessageView')
    
  })
});
