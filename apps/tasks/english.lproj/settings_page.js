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
      childViews: 'titlebar userManager addButton deleteButton usersCount closeButton'.w(),
      
      titlebar: SC.View.design({
        layout: { left: 10, right: 10, top: 5, height: 35 },
        classNames: ['titlebar'],
        childViews: 'userNamePatternField userNamePatternCancelButton title'.w(),
        
        userNamePatternField: SC.TextFieldView.design(SCUI.ToolTip, {
          layout: { centerY: 0, height: 24, left: 7, width: 200 },
          classNames: ['search-bar'],
          hint: "_UserSearchSelectionHint".loc(),
          toolTip: "_UserSearchSelectionTooltip".loc(),
          isVisibleBinding: 'CoreTasks*isCurrentUserAManager',
          valueBinding: 'Tasks.usersController.userNamePattern'
        }),
        userNamePatternCancelButton: SC.View.design({ // User selection cancel button
          layout: { centerY: 1, height: 12, left: 190, width: 12 },
          isVisible: NO,
          classNames: ['filter-cancel-icon'],
          mouseDown: function() {
            Tasks.usersController.set('userNamePattern', '');
          },
          isVisibleBinding: SC.Binding.oneWay('Tasks.usersController.userNamePattern').bool()
        }),

        title: SC.LabelView.design({
          layout: { centerY: 0, centerX: 0, height: 20, width: 120 },
          value: "_Settings".loc(),
          classNames: ['window-title']
        })
        
      }),
    
      userManager: SC.View.design({
        layout: { left: 10, right: 10, top: 40, bottom: 40},
        classNames: ['bordered-view'],
        childViews: 'usersMasterView userDetailView createdAtLabel updatedAtLabel'.w(),
        
        usersMasterView: SC.ScrollView.design({
          layout: { top: 0, bottom: 0, left: 0, width: 300 },
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
          layout: { top: 10, left: 325, bottom: 35, right: 10 },
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
      
      addButton: SC.ButtonView.design({
        layout: { left: 15, bottom: 10, height: 24, width: 32 },
        classNames: ['add-delete-button'],
        titleMinWidth: 0,
        title: '+',
        toolTip: "_AddUserTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateUser',
        target: 'Tasks',
        action: 'addUser'
      }),

      deleteButton: SC.ButtonView.design({
        layout: { left: 57, bottom: 10, height: 24, width: 32 },
        classNames: ['add-delete-button'],
        titleMinWidth: 0,
        title: '-',
        toolTip: "_DeleteUserTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteUser',
        isEnabledBinding: 'Tasks.usersController.isDeletable',
        target: 'Tasks',
        action: 'deleteUser'
      }),
      
      usersCount: SC.LabelView.design({
        layout: { centerX: 0, width: 250, bottom: 12, height: 15 },
        controlSize: SC.SMALL_CONTROL_SIZE,
        textAlign: SC.ALIGN_CENTER,
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