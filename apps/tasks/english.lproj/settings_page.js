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
    
    layout: { centerX: 0, centerY: 0, height: 325, width: 630 },
    
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'userManager usersCount closeButton'.w(),
      
      userManager: SC.View.design({
        layout: { left: 10, right: 10, top: 10, bottom: 45},
        classNames: ['bordered-view'],
        childViews: [
        
          SC.View.design({
            layout: { left: 0, right: 0, top: 0, height: 35 },
            classNames: ['toolbar'],
            childViews: [
            
              SC.LabelView.design(SCUI.SimpleButton,{
                layout: { centerY: 0, left: 5, height: 16, width: 90 },
                icon: 'add-icon',
                value: "_AddUser".loc(),
                classNames: ['toolbar-label'],
                toolTip: "_AddUserTooltip".loc(),
                isEnabledBinding: 'CoreTasks.permissions.canAddUser',
                target: 'Tasks',
                action: 'addUser'
              }),

              SC.LabelView.design(SCUI.SimpleButton,{
                layout: { centerY: 0, left: 90, height: 16, width: 100 },
                icon: 'delete-icon',
                value: "_DeleteUser".loc(),
                classNames: ['toolbar-label'],
                toolTip: "_DeleteUserTooltip".loc(),
                isEnabledBinding: 'Tasks.usersController.isDeletable',
                target: 'Tasks',
                action: 'deleteUser'
              }),
              
              SC.View.design({
                layout: { top: 8, bottom: 8, left: 200, width: 2 },
                classNames: ['top-bar-divider']
              }),
              
              SC.LabelView.design({
                layout: { centerY: 0, left: 310, height: 20, width: 120 },
                value: "_UserManager".loc(),
                classNames: ['window-title']
              })

            ]
          }),
        
          SC.ScrollView.design({
            layout: { top: 35, bottom: 0, left: 0, width: 200 },
            hasHorizontalScroller: NO,
            classNames: ['users-pane'],

            contentView: SC.SourceListView.design({
              layout: { top: 0, left:0, bottom: 0, right: 0 },
              contentValueKey: 'displayName',
              contentBinding: 'Tasks.rolesController.arrangedObjects',
              selectionBinding: 'Tasks.usersController.selection',
              localize: YES,
              rowHeight: 20,
              hasContentIcon: YES,
              contentIconKey: 'icon',
              classNames: ['users-pane-inner']
            })
          }),
          
          Tasks.UserInformationView.design({
            layout: { top: 60, left: 200, bottom: 35, right: 10 },
            contentBinding: 'Tasks.userController'
          })          

        ]
      }),
      
      usersCount: SC.LabelView.design({
        layout: { left: 10, width: 200, bottom: 8, height: 24 },
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
  
  userInformation: SC.outlet('panel.contentView.userManager.childViews.2'),
  usersList: SC.outlet('panel.contentView.userManager.childViews.1.contentView')
  
});