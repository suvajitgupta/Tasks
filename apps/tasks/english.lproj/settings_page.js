// ==========================================================================
// Tasks.settingsPage
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI */
sc_require('core');
sc_require('views/user_item');
sc_require('views/user_information');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Settings Panel
  
*/
Tasks.settingsPage = SC.Page.create({  
  
  panel: SC.PanelPane.create({
    
    layout: { centerX: 0, centerY: 0, height: 425, width: 780 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'userManager usersCount closeButton'.w(),
      
      userManager: SC.View.design({
        layout: { left: 10, right: 10, top: 10, bottom: 45},
        classNames: ['bordered-view'],
        childViews: 'toolbar usersMasterView userDetailView createdAtLabel updatedAtLabel'.w(),
        
        toolbar: SC.View.design({
          layout: { left: 0, right: 0, top: 0, height: 35 },
          classNames: ['toolbar'],
          childViews: 'addButton deleteButton divider title userNamePatternField userNamePatternCancelButton'.w(),
          
          addButton: SC.LabelView.design(SCUI.SimpleButton,{
            layout: { centerY: 0, left: 45, height: 16, width: 90 },
            icon: 'add-icon',
            value: "_AddUser".loc(),
            classNames: ['top-bar-label'],
            toolTip: "_AddUserTooltip".loc(),
            isVisibleBinding: 'CoreTasks.permissions.canCreateUser',
            target: 'Tasks',
            action: 'addUser'
          }),

          deleteButton: SC.LabelView.design(SCUI.SimpleButton,{
            layout: { centerY: 0, left: 145, height: 16, width: 100 },
            icon: 'delete-icon',
            value: "_DeleteUser".loc(),
            classNames: ['top-bar-label'],
            toolTip: "_DeleteUserTooltip".loc(),
            isVisibleBinding: 'CoreTasks.permissions.canDeleteUser',
            isEnabledBinding: 'Tasks.usersController.isDeletable',
            target: 'Tasks',
            action: 'deleteUser'
          }),
          
          divider: SC.View.design({
            layout: { top: 8, bottom: 8, left: 300, width: 2 },
            classNames: ['top-bar-divider']
          }),
          
          title: SC.LabelView.design({
            layout: { centerY: 0, left: 360, height: 20, width: 120 },
            value: "_Settings".loc(),
            classNames: ['window-title']
          }),
          
          userNamePatternField: SC.TextFieldView.design(SCUI.ToolTip, {
            layout: { centerY: 0, height: 24, right: 5, width: 200 },
            classNames: ['user-selection-bar'],
            hint: "_UserSearchPatternSelectionHint".loc(),
            toolTip: "_UserSearchPatternSelectionTooltip".loc(),
            isVisibleBinding: 'CoreTasks*isCurrentUserAManager',
            valueBinding: 'Tasks.usersController.userNamePattern'
          }),
          userNamePatternCancelButton: SC.View.design({ // User selection cancel button
            layout: { centerY: 1, height: 12, right: 10, width: 12 },
            isVisible: NO,
            classNames: ['filter-cancel-icon'],
            mouseDown: function() {
              Tasks.usersController.set('userNamePattern', '');
            },
            isVisibleBinding: SC.Binding.oneWay('Tasks.usersController.userNamePattern').bool()
          })

        }),
      
        usersMasterView: SC.ScrollView.design({
          layout: { top: 35, bottom: 0, left: 0, width: 300 },
          hasHorizontalScroller: NO,
          classNames: ['users-pane'],

          contentView: Tasks.SourceListView.design({
            layout: { top: 0, left:0, bottom: 0, right: 0 },
            contentValueKey: 'displayName',
            contentBinding: 'Tasks.rolesController.arrangedObjects',
            selectionBinding: 'Tasks.usersController.selection',
            localize: YES,
            rowHeight: 24,
            classNames: ['users-pane-inner'],
            exampleView: Tasks.UserItemView,
            hasContentIcon: YES,
            contentIconKey: 'icon',
            canReorderContent: YES,
            canDeleteContent: YES,
            destroyOnRemoval: YES,
            delegate: Tasks.rolesController,
            selectOnMouseDown: YES
          })
        }),
        
        userDetailView: Tasks.UserInformationView.design({
          layout: { top: 50, left: 325, bottom: 35, right: 10 },
          contentBinding: 'Tasks.userController'
        }),
        
        createdAtLabel: SC.LabelView.design({
          layout: { left:305, bottom: 5, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_LEFT,
          valueBinding: SC.binding('Tasks.userController.displayCreatedAt', this)
        }),
        updatedAtLabel: SC.LabelView.design({
          layout: { right:5, bottom: 5, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_RIGHT,
          valueBinding: SC.binding('Tasks.userController.displayUpdatedAt', this)
        })

      }),
      
      usersCount: SC.LabelView.design({
        layout: { left: 10, width: 250, bottom: 8, height: 24 },
        controlSize: SC.SMALL_CONTROL_SIZE,
        textAlign: SC.ALIGN_LEFT,
        valueBinding: 'Tasks.usersController.usersCount' 
      }),
      
      closeButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        localize: YES,
        titleMinWidth: 0,
        keyEquivalent: 'return',
        isDefault: YES,
        theme: 'capsule',
        title: "_Close",
        target: 'Tasks.settingsController',
        action: 'closePanel'
      })
      
    })
      
  }),
  
  userInformation: SC.outlet('panel.contentView.userManager.userDetailView')
  
});