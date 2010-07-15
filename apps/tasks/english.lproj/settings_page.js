// ==========================================================================
// Tasks.settingsPage
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI */
sc_require('core');
sc_require('views/user_item');
sc_require('views/group_item');
sc_require('views/user_information');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Settings Panel
  
*/
Tasks.settingsPage = SC.Page.create({  
  
  panel: SCUI.ModalPane.create({
    
    title: "_Settings".loc(),
    titleIcon: 'settings-icon',
    titleBarHeight: 40,
    minHeight: 350,
    minWidth: 780,
    maxWidth: 780,
    layout: { centerX: 0, centerY: 0, height: 350, width: 780 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'userNamePatternField userNamePatternCancelButton userManager addButton deleteButton usersCount closeButton'.w(),
      
      userNamePatternField: SC.TextFieldView.design(SCUI.ToolTip, {
        layout: { top: 10, height: 24, left: 43, width: 200 },
        classNames: ['search-bar'],
        hint: "_UserSearchSelectionHint".loc(),
        toolTip: "_UserSearchSelectionTooltip".loc(),
        isVisibleBinding: 'CoreTasks*isCurrentUserAManager',
        valueBinding: 'Tasks.usersController.userNamePattern'
      }),
      userNamePatternCancelButton: SC.View.design({ // User selection cancel button
        layout: { top: 17, height: 12, left: 225, width: 12 },
        isVisible: NO,
        classNames: ['filter-cancel-icon'],
        mouseDown: function() {
          Tasks.usersController.set('userNamePattern', '');
        },
        isVisibleBinding: SC.Binding.oneWay('Tasks.usersController.userNamePattern').bool()
      }),

      userManager: SC.View.design({
        layout: { left: 10, right: 10, top: 40, bottom: 40},
        childViews: 'usersMasterView userWellView userDetailView createdAtLabel updatedAtLabel'.w(),
        
        usersMasterView: SC.ScrollView.design({
          layout: { top: 0, bottom: 0, left: 0, width: 290 },
          hasHorizontalScroller: NO,
          classNames: ['users-pane'],

          contentView: SC.ListView.design({
            layout: { top: 0, left:0, bottom: 0, right: 0 },
            contentValueKey: 'displayName',
            contentBinding: 'Tasks.rolesController.arrangedObjects',
            selectionBinding: 'Tasks.usersController.selection',
            localize: YES,
            rowHeight: 24,
            classNames: ['users-pane-inner'],
            hasContentIcon: YES,
            contentIconKey: 'icon',
            exampleView: Tasks.UserItemView,
            groupExampleView: Tasks.GroupItemView, // added to avoid context menu
            isEditable: NO,
            allowDeselectAll: YES,
            canEditContent: YES,
            canReorderContent: YES,
            canDeleteContent: YES,
            destroyOnRemoval: YES,
            selectOnMouseDown: YES,
            delegate: Tasks.rolesController,
          
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
              var items = Tasks.UserItemView.buildContextMenu();
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
        
        userWellView: SC.WellView.design({
          layout: { top: 0, left: 300, height: 230, right: 0 },
          contentView: SC.View.design({
          })
        }),

        userDetailView: Tasks.UserInformationView.design({
          layout: { top: 10, left: 325, height: 200, right: 10 },
          contentBinding: 'Tasks.userController'
        }),
        
        createdAtLabel: SC.LabelView.design({
          layout: { left:305, top: 210, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_LEFT,
          valueBinding: SC.binding('Tasks.userController.displayCreatedAt', this)
        }),
        updatedAtLabel: SC.LabelView.design({
          layout: { right:5, top: 210, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_RIGHT,
          valueBinding: SC.binding('Tasks.userController.displayUpdatedAt', this)
        })

      }),
      
      addButton: SC.ButtonView.design({
        layout: { left: 15, bottom: 10, height: 24, width: 33 },
        classNames: ['dark'],
        titleMinWidth: 0,
        icon: 'add-icon',
        toolTip: "_AddUserTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canCreateUser',
        target: 'Tasks',
        action: 'addUser'
      }),

      deleteButton: SC.ButtonView.design({
        layout: { left: 57, bottom: 10, height: 24, width: 33 },
        classNames: ['dark'],
        titleMinWidth: 0,
        icon: 'delete-icon',
        toolTip: "_DeleteUserTooltip".loc(),
        isVisibleBinding: 'CoreTasks.permissions.canDeleteUser',
        isEnabledBinding: 'Tasks.usersController.isDeletable',
        target: 'Tasks',
        action: 'deleteUser'
      }),
      
      usersCount: SC.LabelView.design({
        layout: { left: 105, width: 200, bottom: 12, height: 15 },
        controlSize: SC.SMALL_CONTROL_SIZE,
        valueBinding: 'Tasks.usersController.usersCount' 
      }),

      closeButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 20, width: 80, height: 24 },
        isDefault: YES,
        title: "_Close".loc(),
        action: 'remove'
      })
      
    }),
    
    remove: function() {
      sc_super();
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
      
  }),
  
  userInformation: SC.outlet('panel.contentView.userManager.userDetailView')
  
});