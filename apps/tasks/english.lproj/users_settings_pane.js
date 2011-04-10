// ==========================================================================
// Tasks.usersSettingsPane
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI */
sc_require('views/list');
sc_require('views/user_item');
sc_require('views/group_item');
sc_require('views/user_information');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Settings Panel
  
*/
Tasks.usersSettingsPane = Tasks.isMobile? null : SCUI.ModalPane.create({
    
  title: "_UsersSettings".loc(),
  titleIcon: 'settings-icon',
  titleBarHeight: 40,
  minHeight: 352,
  minWidth: 770,
  maxWidth: 770,
  layout: { centerX: 0, centerY: 0, height: 352, width: 725 },
  
  contentView: SC.View.design({
    childViews: 'userSearchField userSearchCancelButton userManager addButton deleteButton usersCount closeButton'.w(),
    
    userSearchField: SC.TextFieldView.design(SCUI.ToolTip, {
      layout: { top: 10, height: 24, left: 43, width: 200 },
      classNames: ['search-bar'],
      hint: "_UserSearchHint".loc(),
      toolTip: "_UserSearchTooltip".loc(),
      isVisibleBinding: 'CoreTasks*isCurrentUserAManager',
      valueBinding: 'Tasks.usersController.userSearch'
    }),
    userSearchCancelButton: SC.View.design({ // User selection cancel button
      layout: { top: 14, height: 16, left: 221, width: 16 },
      isVisible: NO,
      classNames: ['filter-cancel-icon'],
      touchStart: function() {
        this.mouseDown();
      },
      mouseDown: function() {
        Tasks.usersController.set('userSearch', '');
      },
      isVisibleBinding: SC.Binding.oneWay('Tasks.usersController.userSearch').bool()
    }),

    userManager: SC.View.design({
      layout: { left: 10, right: 10, top: 40, bottom: 40 },
      childViews: 'usersListView userEditorView'.w(),
      
      usersListView: SC.ScrollView.design({
        layout: { top: 0, bottom: 0, left: 0, width: 290 },
        hasHorizontalScroller: NO,
        classNames: ['users-pane'],
        isVisibleBinding: 'CoreTasks*isCurrentUserAManager',

        contentView: Tasks.ListView.design({
          layout: { top: 0, left:0, bottom: 0, right: 0 },
          contentValueKey: 'displayName',
          contentBinding: 'Tasks.rolesController.arrangedObjects',
          selectionBinding: 'Tasks.usersController.selection',
          localize: YES,
          rowHeight: 24,
          classNames: ['users-pane'],
          hasContentIcon: YES,
          contentIconKey: 'icon',
          exampleView: Tasks.UserItemView,
          groupExampleView: Tasks.GroupItemView, // added to avoid context menu
          isEditable: NO,
          allowDeselectAll: NO,
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
      
      userEditorView: SC.View.design(SC.Border, {
        layout: { top: 0, left: 300, height: 228, right: 0 },
        borderStyle: SC.BORDER_BEZEL,
        childViews: 'userInformationView createdAtLabel updatedAtLabel'.w(),
        
        userInformationView: Tasks.UserInformationView.design({
          layout: { top: 10, left: 0, height: 200, right: 0 }
        }),

        createdAtLabel: SC.LabelView.design({
          layout: { left: 5, top: 205, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_LEFT,
          valueBinding: SC.binding('Tasks.userController.displayCreatedAt', this)
        }),
        updatedAtLabel: SC.LabelView.design({
          layout: { right: 5, top: 205, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_RIGHT,
          valueBinding: SC.binding('Tasks.userController.displayUpdatedAt', this)
        })
        
      })

    }),
    
    addButton: SC.ButtonView.design({
      layout: { left: 15, bottom: 10, height: 24, width: 33 },
      classNames: ['dark'],
      titleMinWidth: 0,
      icon: 'add-icon',
      toolTip: "_AddUserTooltip".loc(),
      isVisibleBinding: 'CoreTasks.permissions.canCreateUser',
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
      action: 'deleteUser'
    }),
    
    usersCount: SC.LabelView.design({
      layout: { left: 105, width: 200, bottom: 12, height: 15 },
      controlSize: SC.SMALL_CONTROL_SIZE,
      isVisibleBinding: 'CoreTasks*isCurrentUserAManager',
      valueBinding: 'Tasks.usersController.usersCount' 
    }),

    closeButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 20, width: 80, height: 24 },
      isDefault: YES,
      title: "_Close".loc(),
      action: 'close'
    })
    
  }),
  
  setSmallSize: function() {
    this.set('isResizable', NO);
    this.set('layout', { centerX: 0, centerY: 0, height: 322, width: 465 });
    this.setPath('contentView.userManager.layout', { left: 10, right: 10, top: 10, bottom: 40 });
    this.setPath('contentView.userManager.userEditorView.layout', { top: 0, left: 0, height: 228, right: 0 });
  },
  
  focus: function() {
    this.getPath('contentView.userManager.userEditorView.userInformationView.fullNameField').becomeFirstResponder();   
  }
    
});