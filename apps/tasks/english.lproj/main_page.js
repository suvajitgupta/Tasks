// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI sc_static*/

sc_require('mixins/localized_label');
sc_require('views/projects_list');
sc_require('views/tasks_list');
sc_require('views/task_editor');
sc_require('views/logo');
sc_require('views/summary');

/** @namespace

  This page lays out the Tasks application user interface.
  
  @extends SC.Object
  @author Suvajit Gupta
  @author Joshua Holt
*/

// FIXME: [SC] fix strange-looking scrollbars next to CollectionViews on iPad
// FIXME: [SC] fix CollectionView sluggish scrolling on iPad (will Ace2 work better?)
// TODO: [SG] provide project/task "duplicate" capability on iPad since it is only available on context menus that aren't available on touch devices

Tasks.mainPageHelper = SC.Object.create({

  panelOpenBinding: SC.Binding.oneWay('Tasks*panelOpen'),
  displayedTasksCountBinding: SC.Binding.oneWay('Tasks.tasksController*arrangedObjects.length'),
  autoSaveBinding: SC.Binding.oneWay('Tasks*autoSave'),
  sendNotificationsBinding: SC.Binding.oneWay('CoreTasks*sendNotifications'),
  clippyDetailsId: 'clippy-details',
  clippyDetails: null,
  showProjectsList: true,

  _embedClippy: function(context) {
    var clippyTooltip = "_ClippyTooltip".loc();
    context.push('<span style="display:none;" id="' + Tasks.mainPageHelper.clippyDetailsId + '"></span>');
    context.push('<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"\n' +
                 'width="14"\n' +
                 'height="15"\n' +
                 'id="clippy-object" >\n' +
                 '<param name="movie" value="' + static_url('clippy.swf') + '"/>\n' +
                 '<param name="allowScriptAccess" value="always" />\n' +
                 '<param name="quality" value="high" />\n' +
                 '<param name="scale" value="noscale" />\n' +
                 '<param NAME="FlashVars" value="id=' + Tasks.mainPageHelper.clippyDetailsId + '">\n' +
                 '<param name="bgcolor" value="#FFF">\n' +
                 '<param name="wmode" value="opaque">\n' +
                 '<embed src="' + static_url('clippy.swf') + '"\n' +
                 'width="14"\n' +
                 'height="15"\n' +
                 'name="clippy"\n' +
                 'quality="high"\n' +
                 'allowScriptAccess="always"\n' +
                 'type="application/x-shockwave-flash"\n' +
                 'pluginspage="http://www.macromedia.com/go/getflashplayer"\n' +
                 'FlashVars="id=' + Tasks.mainPageHelper.clippyDetailsId + '"\n' +
                 'bgcolor="#FFF"\n' +
                 'wmode="opaque"\n' +
                 '/>\n' +
                 '</object>\n').attr('title', clippyTooltip).attr('alt', clippyTooltip);
  },
  
  _listActions: function() {
    // console.log('DEBUG: _listActions()');
    var ret = [];
    ret.push({ title: "_LaunchSettings".loc(), icon: 'settings-icon', action: 'showUsersSettingsPanel', isEnabled: YES });
    if(!SC.platform.touch) {
      var showProjectsList = this.get('showProjectsList');
      ret.push({ title: "_ShowProjectsList".loc(), icon: 'empty-project-icon', action: 'toggleShowProjectsList', isEnabled: YES, checkbox: showProjectsList });
    }
    var autoSave = this.get('autoSave');
    ret.push({ title: "_AutoSave".loc(), icon: 'save-icon', action: 'toggleAutoSave', isEnabled: YES, checkbox: autoSave });
    if(Tasks.get('canServerSendNotifications')) {
      var sendNotifications = this.get('sendNotifications');
      ret.push({ title: "_SendNotifications".loc(), icon: 'email-icon', action: 'toggleSendNotifications', isEnabled: YES, checkbox: sendNotifications });
    }
    if(!Tasks.panelOpen) {
      ret.push({ isSeparator: YES });
      if(this.getPath('displayedTasksCount') > 0) {
        ret.push({ title: "_LaunchStatistics".loc(), icon: 'statistics-icon', action: 'showStatisticsPanel', isEnabled: YES });
      }
      ret.push({ title: "_LaunchImport".loc(), icon: 'import-icon', action: 'showTextImportPanel', isEnabled: YES });
      ret.push({ title: "_LaunchExportText".loc(), icon: 'text-icon', action: 'showTextExportPanel', isEnabled: YES });
      if(!SC.platform.touch) {
        ret.push({ title: "_LaunchExportHTML".loc(), icon: 'html-icon', action: 'showHTMLExportWindow', isEnabled: YES });
      }
    }
    ret.push({ isSeparator: YES });
    ret.push({ title: "_LaunchHelp".loc(), icon: 'sc-icon-help-16', action: 'showHelpWindow', isEnabled: YES });
    ret.push({ title: "_Logout".loc(), icon: 'logout-icon', action: 'logout', isEnabled: YES });
    this.set('actions', ret);
  }.observes('showProjectsList', 'panelOpen', 'displayedTasksCount', 'autoSave', 'sendNotifications'),
  actions: null,
  
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

   childViews: 'mainView'.w(),
   
   mainView: Tasks.isMobile?
    
    SC.SceneView.design({
      scenes: ['projectsList', 'tasksList', 'taskEditor'],
      projectsList: Tasks.ProjectsListView.create(),
      tasksList: Tasks.TasksListView.create(),
      taskEditor: Tasks.taskEditorView,
      transitionDuration: 0,
      nowShowing: 'projectsList'
    }) :
    
    SC.MasterDetailView.design({
     
     layout: { top: 0, left: 0, right: 0, bottom: 0, minWidth: SC.platform.touch? 768 : 1024, minHeight: 500 },
     masterWidth: 260,
     
     autoHideMaster: function() {
       return YES;
     }.property().cacheable(),
     
     showProjectsListBinding: SC.Binding.oneWay('Tasks.mainPageHelper*showProjectsList'),
     orientation: function() {
       if(SC.platform.touch) return sc_super();
       else return this.get('showProjectsList')? SC.HORIZONTAL_ORIENTATION : SC.VERTICAL_ORIENTATION;
     }.property('frame', 'showProjectsList').cacheable(),
     
     masterView: SC.WorkspaceView.design({
       
      topToolbar: SC.ToolbarView.design({
        
        childViews: 'installationLogo tasksLogo'.w(),
        classNames: ['title-bar'],
        
        installationLogo: SC.View.design({
          layout: { left: Tasks.get('squareInstallationLogo')? 25: 15, centerY: 0, width: Tasks.get('squareInstallationLogo')? 35: 80, height: Tasks.get('squareInstallationLogo')? 35 : 20 },
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
            else if(document.title.match(/Eloqua/)) {
              context.attr('src', sc_static('images/eloqua-logo.gif'));
            }
            // Customizable "Installation Logo" that is driven by "Installation Title" from Buildfile
            // Uncomment next 3 lines and specify <InstallationTitle> (matching what you set in Buildfile) and <installation-logo-filename>
            // else if(document.title.match(/<InstallationTitle>/)) {
            //   context.attr('src', sc_static('images/<installation-logo-filename>'));
            // }
          }
        }), // installationLogo
        
        tasksLogo: Tasks.LogoView.design({
          layout: { left: Tasks.get('squareInstallationLogo')? 78: 115, width: 104, centerY: 0, height: 27 },
          logo: 'tasks-logo-small',
          toolTip: "_Credits".loc(),
          version: Tasks.VERSION
        })
        
      }), // topToolBar
       
      contentView: SC.View.design({ // projectsList/BottomBar
        
        childViews: 'projectsList projectsBottomBar'.w(),
        
        projectsList: Tasks.ProjectsListView.design({
          layout: { top: 0, bottom: 35, left: 10, right: 5 }
        }),
        
        projectsBottomBar: SC.View.design({

          layout: { bottom: 0, height: 35, left: 0, right: 0 },
          childViews: 'addProjectButton deleteProjectButton'.w(),

          addProjectButton: SC.ButtonView.design({
            layout: { centerY: 0, left: 10, height: 24, width: 32 },
            classNames: ['dark'],
            titleMinWidth: 0,
            icon: 'add-icon',
            toolTip: "_AddProjectTooltip".loc(),
            isVisibleBinding: 'CoreTasks.permissions.canCreateProject',
            action: 'addProject'
          }),
          deleteProjectButton: SC.ButtonView.design({
            layout: { centerY: 0, left: 52, height: 24, width: 32 },
            classNames: ['dark'],
            titleMinWidth: 0,
            icon: 'delete-icon',
            toolTip: "_DeleteProjectTooltip".loc(),
            isVisibleBinding: 'CoreTasks.permissions.canDeleteProject',
            isEnabledBinding: 'Tasks.projectsController.isDeletable',
            action: 'deleteProject'
          })
           
        }) // projectsBottomBar
         
       }) // projectsList/BottomBar
       
     }), // masterView

     detailView: SC.WorkspaceView.design({

       topToolbar: SC.ToolbarView.design({
         
         childViews: 'actionsButton displayModeButton masterPickerButton welcomeMessageLabel clippyIcon filterPanelButton filterCancelButton tasksSearchField tasksSearchCancelButton'.w(),
         classNames: ['title-bar'],
         
         actionsButton: SC.ButtonView.design(SCUI.DropDown, {
           layout: { centerY: 0, left: 10, height: 24, width: 50 },
           classNames: ['dark'],
           titleMinWidth: 0,
           hasIcon: YES,
           icon: 'actions-icon',
           toolTip: "_ActionsButtonTooltip".loc(),
           dropDown: SC.MenuPane.design({
             contentView: SC.View.design(),
             layout: { width: 175, height: 0 },
             itemTitleKey: 'title',
             itemIconKey: 'icon',
             itemTargetKey: 'target',
             itemActionKey: 'action',
             itemSeparatorKey: 'isSeparator',
             itemIsEnabledKey: 'isEnabled',
             itemCheckboxKey: 'checkbox',
             itemsBinding: SC.Binding.oneWay('Tasks.mainPageHelper*actions')    
           })
         }),

         displayModeButton: SC.ButtonView.design({
           layout: { left: 73, centerY: 0, height: 24, width: 50 },
            classNames: ['dark'],
            titleMinWidth: 0,
            toolTip: "_DisplayModeTooltip".loc(),
            titleBinding: SC.Binding.transform(function(value, binding) {
                                                 return value? "_TEAM".loc() : "_TASKS".loc();
                                               }).from('Tasks.assignmentsController*displayMode'),
            action: function() { // toggle display mode
              Tasks.assignmentsController.set('displayMode', !Tasks.assignmentsController.get('displayMode'));
            }
          }),

         masterPickerButton: SC.ButtonView.design({
           layout: { left: 135, centerY: 0, height: 24, width: 32 },
           titleMinWidth: 0,
           icon: 'empty-project-icon',
           classNames: ['dark'],
           target: 'Tasks.mainPage.mainPane.mainView',
           action: 'toggleMasterPicker',
           isVisibleBinding: SC.Binding.oneWay('Tasks.mainPage.mainPane.mainView.masterIsHidden')
         }),
         
         welcomeMessageLabel: SC.LabelView.design(SCUI.ToolTip, {
           layout: { centerX: -75, centerY: -2, width: 250, height: 32 },
           classNames: ['welcome-message'],
           escapeHTML: NO,
           touchStart: function() {
             this.mouseDown();
           },
           mouseDown: function() {
             if(Tasks.mainPageHelper.get('panelOpen')) return;
             Tasks.filterSearchController.setCurrentUserTasksSearch();
           },
           valueBinding: SC.Binding.oneWay('Tasks.mainPageHelper.welcomeMessage'),
           isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen'),
           render: function() {
             sc_super();
           }
         }),

         clippyIcon: SC.View.design({
           layout: { centerY: 0, right: 289, height: 14, width: 14 },
           isVisibleBinding: SC.Binding.oneWay('Tasks.tasksController.displayClippy'),
           // isVisibleBinding: SC.Binding.oneWay('Tasks.tasksController.hasSelection'),
           render: function(context, firstTime) {
             // console.log('clippyIcon.render()');
             if(firstTime) {
               Tasks.mainPageHelper._embedClippy(context);
             }
           }
         }),

         filterPanelButton: SC.ButtonView.design({
           layout: { centerY: 0, height: 24, right: 223, width: 50 },
           titleMinWidth: 0,
           icon: 'filter-icon',
           classNames: ['dark'],
           toolTip: "_FilterTooltip".loc(),
           action: 'showTasksFilter',
           isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
         }),
         filterCancelButton: SC.View.design(SC.Control, { // Filter cancel button
           layout: { centerY: 0, height: 16, right: 218, width: 16 },
           isVisible: NO,
           classNames: ['filter-cancel-icon'],
           touchStart: function() {
             this.mouseDown();
           },
           mouseDown: function() {
             if(Tasks.mainPageHelper.get('panelOpen')) return;
             Tasks.filterSearchController.clearAttributeFilterCriteria();
             Tasks.assignmentsController.computeTasks();
           },
           isVisibleBinding: SC.Binding.oneWay('Tasks.filterSearchController.isAttributeFilterEnabled').bool(),
           isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
         }),

         tasksSearchField: SC.TextFieldView.design({
           layout: { centerY: 1, height: 25, right: 10, width: 200 },
           classNames: ['search-bar'],
           hint: "_TasksSearchHint".loc(),
           renderMixin: function(context, firstTime) { // Used custom tooltip rendering to avoid escaping by SCUI.Toolip
             context.attr('title', "_TasksSearchTooltip".loc()) ;
           },
           valueBinding: 'Tasks.filterSearchController.tasksSearch',
           isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
         }),
         tasksSearchCancelButton: SC.View.design(SC.Control, { // Tasks Search cancel button
           layout: { centerY: 0, height: 16, right: 16, width: 16 },
           isVisible: NO,
           classNames: ['filter-cancel-icon'],
           touchStart: function() {
             this.mouseDown();
           },
           mouseDown: function() {
             if(Tasks.mainPageHelper.get('panelOpen')) return;
             Tasks.filterSearchController.set('tasksSearch', '');
           },
           isVisibleBinding: SC.Binding.oneWay('Tasks.filterSearchController.tasksSearch').bool(),
           isEnabledBinding: SC.Binding.not('Tasks.mainPageHelper*panelOpen')
         })

       }), // topToolbar

       contentView: SC.View.design({ // tasksList/BottomBar
         
          childViews: 'tasksSceneView tasksBottomBar'.w(),
          
          tasksSceneView: SC.SceneView.design({
            layout: { top: 2, bottom: 35, left: 5, right: 10 },
            scenes: ['tasksList', 'taskEditor'],
            tasksList: Tasks.TasksListView.create(),
            taskEditor: Tasks.taskEditorView,
            transitionDuration: 0,
            nowShowing: 'tasksList'
          }),
         
          tasksBottomBar: SC.View.design({

             layout: { bottom: 0, height: 35, left: 0, right: 0 },
             childViews: 'addTaskButton deleteTaskButton summaryView serverMessageView saveButton refreshButton'.w(),

             addTaskButton: SC.ButtonView.design({
               layout: { centerY: 0, left: 5, height: 24, width: 32 },
               classNames: ['dark'],
               titleMinWidth: 0,
               icon: 'add-icon',
               toolTip: "_AddTaskTooltip".loc(),
               isVisibleBinding: 'CoreTasks.permissions.canCreateTask',
               isEnabledBinding: 'Tasks.tasksController.isAddable',
               action: 'addTask'
             }),
             deleteTaskButton: SC.ButtonView.design(SCUI.Permissible,{
               layout: { centerY: 0, left: 47, height: 24, width: 32 },
               classNames: ['dark'],
               titleMinWidth: 0,
               icon: 'delete-icon',
               toolTip: "_DeleteTaskTooltip".loc(),
               isVisibleBinding: 'CoreTasks.permissions.canDeleteTask',
               isEnabledBinding: SC.Binding.and('Tasks.tasksController.isDeletable', 'Tasks.tasksController.notGuestOrGuestSubmittedTasks'),
               isPermittedBinding: 'Tasks.tasksController.notGuestOrGuestSubmittedTasks',
               action: 'deleteTask'
             }),

             summaryView: Tasks.SummaryView.design({
               layout: { centerY: 0, height: 18, left: 90, width: 400 },
               classNames: ['bottom-bar-label'],
               escapeHTML: NO,
               panelOpenBinding: SC.Binding.oneWay('Tasks*panelOpen'),
               assignmentsSummaryBinding: SC.Binding.oneWay('Tasks.assignmentsController.assignmentsSummary'),
               projectsSelectionBinding: SC.Binding.oneWay('Tasks.projectsController.selection'),
               tasksSelectionBinding: SC.Binding.oneWay('Tasks.tasksController.selection')
             }),

             serverMessageView: SC.LabelView.design({
               layout: { centerY: 0, height: 18, right: 95, width: 250 },
               classNames: ['bottom-bar-label'],
               escapeHTML: NO,
               icon: '',
               textAlign: SC.ALIGN_RIGHT,
               value: '',
               isVisibleBinding: SC.Binding.not('Tasks.mainPage.mainPane.mainView.masterIsHidden').oneWay()
             }),

             saveButton: SC.ButtonView.design({
               layout: { centerY: 0, right: 53, height: 24, width: 32 },
               classNames: ['dark'],
               titleMinWidth: 0,
               icon: 'save-icon',
               toolTip: "_SaveTooltip".loc(),
               isEnabledBinding: 'CoreTasks.needsSave',
               isVisibleBinding: SC.Binding.not('Tasks.autoSave'),
               action: 'save'
             }),
             refreshButton: SC.ButtonView.design({
               layout: { centerY: 0, right: 10, height: 24, width: 32 },
               classNames: ['dark'],
               titleMinWidth: 0,
               icon: 'refresh-icon',
               toolTip: "_RefreshTooltip".loc(),
               action: 'refresh',
               isEnabledBinding: SC.Binding.transform(function(value, binding) {
                                                        return value === ''; // when not saving, shown via progress icon
                                                      }).from('Tasks.mainPage.serverMessageView.icon')
             })

           }) // tasksBottomBar

          }) // tasksList/BottomBar

        }) // detailView

      }) // mainView
       
   }), // mainPane

   projectsListView: SC.outlet(Tasks.isMobile? 'mainPane.mainView.projectsList.contentView' : 'mainPane.mainView.masterView.contentView.projectsList.contentView'),
   tasksListView: SC.outlet(Tasks.isMobile? 'mainPane.mainView.tasksList.contentView' : 'mainPane.mainView.detailView.contentView.tasksSceneView.tasksList.contentView'),
   tasksSceneView: SC.outlet('mainPane.mainView.detailView.contentView.tasksSceneView'),
   welcomeMessageView: SC.outlet('mainPane.mainView.detailView.topToolbar.welcomeMessageLabel'),
   serverMessageView: SC.outlet('mainPane.mainView.detailView.contentView.tasksBottomBar.serverMessageView')
   
}); // mainPage
