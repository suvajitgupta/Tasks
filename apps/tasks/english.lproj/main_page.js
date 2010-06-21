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

Tasks._wideLogo = document.title.match(/Eloqua/)? true : false;
Tasks.mainPageHelper = SC.Object.create({

  displayedTasksCountBinding: SC.Binding.oneWay('Tasks.tasksController*arrangedObjects.length'),
  autoSaveBinding: SC.Binding.oneWay('CoreTasks*autoSave'),
  shouldNotifyBinding: SC.Binding.oneWay('CoreTasks*shouldNotify'),

  _listActions: function() {
    var ret = [];
    if(this.getPath('displayedTasksCount') > 0) {
      ret.push({ title: "_LaunchStatistics".loc(), icon: 'statistics-icon', target: 'Tasks', action: 'viewStatistics', isEnabled: YES });
      ret.push({ isSeparator: YES });
    }
    ret.push({ title: "_LaunchSettings".loc(), icon: 'settings-icon', target: 'Tasks', action: 'settings', isEnabled: YES });
    var autoSave = this.get('autoSave');
    ret.push({ title: "_Toggle".loc() + "_AutoSave".loc(), icon: 'save-icon', target: 'Tasks', action: 'toggleAutoSave', isEnabled: YES, checkbox: autoSave });
    if(CoreTasks.get('canServerSendNotifications')) {
      var shouldNotify = this.get('shouldNotify');
      ret.push({ title: "_Toggle".loc() + "_SendNotifications".loc(), icon: 'email-icon', target: 'Tasks', action: 'toggleShouldNotify', isEnabled: YES, checkbox: shouldNotify });
    }
    ret.push({ isSeparator: YES });
    ret.push({ title: "_LaunchImport".loc(), icon: 'import-icon', target: 'Tasks', action: 'importData', isEnabled: YES });
    ret.push({ title: "_LaunchExportText".loc(), icon: 'text-icon', target: 'Tasks.exportDataController', action: 'exportDataAsText', isEnabled: YES });
    ret.push({ title: "_LaunchExportHTML".loc(), icon: 'html-icon', target: 'Tasks.exportDataController', action: 'exportDataAsHTML', isEnabled: YES });
    ret.push({ isSeparator: YES });
    ret.push({ title: "_LaunchHelp".loc(), icon: 'sc-icon-help-16', target: 'Tasks', action: 'help', isEnabled: YES });
    ret.push({ title: "_Logout".loc(), icon: 'logout-icon', target: 'Tasks', action: 'logout', isEnabled: YES });
    return ret;
  }.property('displayedTasksCount', 'autoSave', 'shouldNotify').cacheable(),
  
  currentUserNameBinding: SC.Binding.oneWay('CoreTasks*currentUser.name'),
  currentUserRoleBinding: SC.Binding.oneWay('CoreTasks*currentUser.role'),
  welcomeMessage: function() {
    var name = this.get('currentUserName');
    var role = this.get('currentUserRole');
    if(SC.none(name) || SC.none(role)) return '';
    if(!Tasks.softwareMode && role === CoreTasks.USER_ROLE_DEVELOPER) role = "_User";
    return "_Hi".loc() + '<b>' + name + '</b><br><small>' + role.loc() + '</small>';
  }.property('currentUserName', 'currentUserRole').cacheable()
  
});

Tasks.mainPage = SC.Page.design({

  mainPane: SC.MainPane.design({
    
    layerId: 'mainPane',
    layout: { left: 0, right: 0, top: 0, bottom: 0, minWidth: 1024, minHeight: 640 },
    childViews: 'topBarView masterDetailView bottomBarView'.w(),
    
    topBarView: SC.View.design(SC.Border, {
      
      layout: { top: 0, left: 0, right: 0, height: 56 },
      classNames: ['title-bar'],
      childViews: 'installationLogo tasksLogo actionsMenu displayModeSegments welcomeMessageLabel filterPanelButton filterCancelButton tasksSearchField tasksSearchCancelButton'.w(),
      
      installationLogo: SC.View.design({
        layout: { left: 4, centerY: -4, width: Tasks._wideLogo? 80: 35, height: Tasks._wideLogo? 20 : 35 },
        tagName: 'img',
        render: function(context, firstTime) {
          if(document.title.match(/Dev/)) {
            context.attr('src', sc_static('images/dev-logo.jpg'));
          }
          else if(document.title.match(/Demo/)) {
            context.attr('src', sc_static('images/demo-logo.jpg'));
          }
          else if(document.title.match(/SproutCore/)) {
            context.attr('src', sc_static('images/sproutcore-logo.png'));
          }
          else if(document.title.match(/Greenhouse/)) {
            context.attr('src', sc_static('images/greenhouse-logo.png'));
          }
          else if(document.title.match(/TPG/)) {
            context.attr('src', sc_static('images/tpg-logo.png'));
          }
          else if(document.title.match(/Eloqua/)) {
            context.attr('src', sc_static('images/eloqua-logo.gif'));
          }
        }
      }),
      
      tasksLogo: Tasks.LogoView.design({
        layout: { left: Tasks._wideLogo? 98 : 50, width: 145, centerY: -4, height: 27 }
      }),

      actionsMenu: SC.ButtonView.design(SCUI.DropDown, {
        layout: { centerY: -4, left: 245, height: 24, width: 52 },
        classNames: ['image-button'],
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
          itemsBinding: SC.Binding.oneWay('Tasks.mainPageHelper._listActions')    
        })
      }),

      displayModeSegments: SC.SegmentedView.design(SCUI.ToolTip, {
        layout: { left: 305, centerY: -4, height: 24, width: 90 },
        items: [
          { title: '', icon: 'sc-icon-group-16', value: Tasks.DISPLAY_MODE_TEAM },
          { title: '', icon: 'tasks-icon', value: Tasks.DISPLAY_MODE_TASKS }
        ],
        itemTitleKey: 'title',
        itemIconKey: 'icon', // disabling icons for now - appearing too cluttered
        itemValueKey: 'value',
        toolTip: "_DisplayModeTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.displayMode'
      }),

      welcomeMessageLabel: SC.LabelView.design(SCUI.ToolTip, {
        layout: { centerX: 55, centerY: -4, width: 250, height: 32 },
        classNames: ['welcome-message'],
        escapeHTML: NO,
        valueBinding: SC.Binding.oneWay('Tasks.mainPageHelper.welcomeMessage')
      }),

      filterPanelButton: SC.ButtonView.design({
        layout: { centerY: -4, height: 24, right: 216, width: 50 },
        titleMinWidth: 0,
        icon: 'filter-icon',
        classNames: ['image-button'],
        toolTip: "_FilterTooltip".loc(),
        target: 'Tasks',
        action: 'filterTasks'
      }),
      filterCancelButton: SC.View.design({ // Filter cancel button
        layout: { centerY: -3, height: 12, right: 219, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.clearAttributeFilter();
          Tasks.assignmentsController.showAssignments();
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.attributeFilterEnabled').bool()
      }),
    
      tasksSearchField: SC.TextFieldView.design(SCUI.ToolTip, {
        layout: { centerY: -4, height: 24, right: 5, width: 200 },
        classNames: ['search-bar'],
        hint: "_TasksSearchHint".loc(),
        toolTip: "_TasksSearchTooltip".loc(),
        valueBinding: 'Tasks.assignmentsController.searchFilter'
      }),
      tasksSearchCancelButton: SC.View.design({ // Tasks Search cancel button
        layout: { centerY: -3, height: 12, right: 10, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.assignmentsController.set('searchFilter', '');
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.assignmentsController.searchFilter').bool()
      })
                                   
    }),
    
    welcomeMessage: SC.outlet('topBarView.welcomeMessageLabel'),
    
    masterDetailView: SC.View.design({
      layout: { top: 43, bottom: 26, left: 0, right: 0 },
      childViews: 'projectsMasterView tasksDetailView'.w(),
      
      projectsMasterView: SC.ScrollView.design({
        layout: { top: 10, bottom: 10, left: 10, width: 225 },
        classNames: ['projects-pane'],
        hasHorizontalScroller: NO,

        contentView: SC.SourceListView.design({
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
          groupExampleView: Tasks.GroupItemView, // added to avoid context menu
          isEditable: YES,
          allowDeselectAll: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          selectOnMouseDown: YES,
          delegate: Tasks.projectsListDelegate,
          
          selectionEvent: null,
          mouseDown: function(event) {
            var ret = sc_super();
            if(event.which === 3) { // right click
              this.set('selectionEvent', event);
              this.invokeLast('popupContextMenu');
            }
            return ret;
          },
          popupContextMenu: function() {
            var items = Tasks.ProjectItemView.buildContextMenu();
            if(items.length > 0) {
              var pane = SCUI.ContextMenuPane.create({
                contentView: SC.View.design({}),
                layout: { width: 125, height: 0 },
                itemTitleKey: 'title',
                itemIconKey: 'icon',
                itemIsEnabledKey: 'isEnabled',
                itemTargetKey: 'target',
                itemActionKey: 'action',
                itemSeparatorKey: 'isSeparator',
                items: items
              });
              pane.popup(this, this.get('selectionEvent')); // pass in the mouse event so the pane can figure out where to put itself
            }
          }
                           
        })
      }),
      
      tasksDetailView: SC.ScrollView.design({
        layout: { top: 5, bottom: 10, left: 245, right: 10 },
        hasHorizontalScroller: NO,

        contentView: SC.SourceListView.design({
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
          allowDeselectAll: YES,
          canEditContent: YES,
          canReorderContent: YES,
          canDeleteContent: YES,
          destroyOnRemoval: YES,
          selectOnMouseDown: YES,
          delegate: Tasks.tasksListDelegate,
          
          selectionEvent: null,
          mouseDown: function(event) {
            var ret = sc_super();
            if(event.which === 3) { // right click
              this.set('selectionEvent', event);
              this.invokeLast('popupContextMenu');
            }
            return ret;
          },
          popupContextMenu: function() {
            var items = Tasks.TaskItemView.buildContextMenu();
            if(items.length > 0) {
              var pane = SCUI.ContextMenuPane.create({
                contentView: SC.View.design({}),
                layout: { width: 180, height: 0 },
                escapeHTML: NO,
                itemTitleKey: 'title',
                itemIconKey: 'icon',
                itemIsEnabledKey: 'isEnabled',
                itemTargetKey: 'target',
                itemActionKey: 'action',
                itemSeparatorKey: 'isSeparator',
                itemCheckboxKey: 'checkbox',
                items: items        
              });
              pane.popup(this, this.get('selectionEvent')); // pass in the mouse event so the pane can figure out where to put itself
            }
          },
          
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
              context.addClass('helper-select-project');
              return;
            }
            else if(selectedProjectsCount === 1) { // Single project selected
              if(sel.getPath('firstObject.tasks.length') === 0) { // Project has no tasks
                if(Tasks.tasksController.isAddable()) context.addClass('helper-add-tasks');
                else context.addClass('helper-display-mode');
                return;
              }
              else { // Project has tasks
                if(this.getPath('content.length') === 0) { // No tasks filtering through
                  context.addClass('helper-adjust-filter');
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
                  context.addClass('helper-adjust-filter');
                  return;
                }
              }
            }
            
            // Remove helper images (if any) and render tasks
            context.removeClass('helper-add-tasks');
            context.removeClass('helper-display-mode');
            context.removeClass('helper-adjust-filter');
            sc_super();
          }
                    
        }),
        
        // Hotkeys - be careful to avoid conflicts with browser shortcuts!
        keyDown: function(event) {
          var ret, commandCode = event.commandCodes();
          // console.log('DEBUG: hotkey "' + commandCode[0] + '" pressed');
          if (commandCode[0] === 'ctrl_='){  // control_equals
            Tasks.addTask();
            ret = YES;
          }
          else if (commandCode[0] === 'ctrl_shift_+'){  // control_shift_plus
            Tasks.duplicateTask();
            ret = YES;
          }
          else {
            ret = this.interpretKeyEvents(event) ;
          }
          return ret;
        }
        
      })
        
    }),

    projectsList: SC.outlet('masterDetailView.projectsMasterView.contentView'),
    tasksList: SC.outlet('masterDetailView.tasksDetailView.contentView'),
    
    bottomBarView: SC.View.design(SC.Border, {
      layout: { bottom: 0, height: 35, left: 0, right: 0 },
      childViews: 'addProjectButton deleteProjectButton addTaskButton deleteTaskButton summaryView serverMessageView saveButton refreshButton'.w(),
        
      addProjectButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 10, height: 24, width: 33 },
        classNames: ['image-button'],
        titleMinWidth: 0,
        icon: 'add-icon',
        toolTip: "_AddProjectTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateProject',
        target: 'Tasks',
        action: 'addProject'
      }),
      deleteProjectButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 52, height: 24, width: 33 },
        classNames: ['image-button'],
        titleMinWidth: 0,
        icon: 'delete-icon',
        toolTip: "_DeleteProjectTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteProject',
        isEnabledBinding: 'Tasks.projectsController.isDeletable',
        target: 'Tasks',
        action: 'deleteProject'
      }),
      
      addTaskButton: SC.ButtonView.design({
        layout: { centerY: 0, left: 250, height: 24, width: 33 },
        classNames: ['image-button'],
        titleMinWidth: 0,
        icon: 'add-icon',
        toolTip: "_AddTaskTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateTask',
        isEnabledBinding: 'Tasks.tasksController.isAddable',
        target: 'Tasks',
        action: 'addTask'
      }),
      deleteTaskButton: SC.ButtonView.design(SCUI.Permissible,{
        layout: { centerY: 0, left: 292, height: 24, width: 33 },
        classNames: ['image-button'],
        titleMinWidth: 0,
        icon: 'delete-icon',
        toolTip: "_DeleteTaskTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteTask',
        isEnabledBinding: SC.Binding.logicalAnd('Tasks.tasksController.isDeletable', 'Tasks.tasksController.notGuestOrGuestSubmittedTasks'),
        isPermittedBinding: 'Tasks.tasksController.notGuestOrGuestSubmittedTasks',
        target: 'Tasks',
        action: 'deleteTask'
      }),
      
      summaryView: Tasks.SummaryView.design({
        layout: { centerY: 0, height: 16, centerX: 20, width: 450 },
        classNames: ['bottom-bar-label'],
        textAlign: SC.ALIGN_CENTER,
        assignmentsSummaryBinding: SC.Binding.oneWay('Tasks.assignmentsController.assignmentsSummary'),
        projectsSelectionBinding: SC.Binding.oneWay('Tasks.projectsController.selection'),
        tasksSelectionBinding: SC.Binding.oneWay('Tasks.tasksController.selection')
      }),
        
      serverMessageView: SC.LabelView.design({
        layout: { centerY: 0, height: 16, right: 95, width: 250 },
        classNames: ['bottom-bar-label'],
        icon: '',
        textAlign: SC.ALIGN_RIGHT,
        value: ''
      }),
      
      saveButton: SC.ButtonView.design({
        layout: { centerY: 0, right: 53, height: 24, width: 33 },
        classNames: ['image-button'],
        titleMinWidth: 0,
        icon: 'save-icon',
        toolTip: "_SaveTooltip".loc(),
        isEnabledBinding: 'CoreTasks.needsSave',
        isVisibleBinding: SC.Binding.transform(function(value, binding) {
                                                 return !value;
                                               }).from('CoreTasks.autoSave'),
        target: 'Tasks',
        action: 'saveData'
      }),
      refreshButton: SC.ButtonView.design({
        layout: { centerY: 0, right: 10, height: 24, width: 33 },
        classNames: ['image-button'],
        titleMinWidth: 0,
        icon: 'refresh-icon',
        toolTip: "_RefreshTooltip".loc(),
        target: 'Tasks',
        action: 'refreshData',
        isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                                 return value === ''; // when not saving, shown via progress icon
                                               }).from('Tasks.mainPage.mainPane.serverMessage.icon')
      })            
    }),
    
    serverMessage: SC.outlet('bottomBarView.serverMessageView')
    
  })
});
