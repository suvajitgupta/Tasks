// ==========================================================================
// Tasks.settingsPage
// ==========================================================================
/*globals CoreTasks Tasks sc_require */
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
    
    layout: { centerX: 0, centerY: 0, height: 325, width: 605 },
    
    usersList: SC.outlet('contentView.userManager.childViews.1.contentView'),
    contentView: SC.View.design({
      layout: { left: 0, right: 0, top: 0, bottom: 0},
      childViews: 'userManager closeButton'.w(),
      
      userManager: SC.View.design({
        layout: { left: 10, right: 10, top: 10, bottom: 45},
        classNames: ['bordered-view'],
        childViews: [
        
          SC.View.design({
            layout: { left: 0, right: 0, top: 0, height: 35 },
            classNames: ['toolbar'],
            childViews: [
            
              SC.LabelView.design(Tasks.SimpleButton,{
                layout: { centerY: 0, left: 5, height: 16, width: 90 },
                icon: 'add-icon',
                value: "_AddUser".loc(),
                classNames: ['toolbar-label'],
                toolTip: "_AddUserTooltip".loc(),
                target: 'Tasks',
                action: 'addUser'
              }),

              SC.LabelView.design(Tasks.SimpleButton,{
                layout: { centerY: 0, left: 100, height: 16, width: 90 },
                icon: 'delete-icon',
                value: "_DelUser".loc(),
                classNames: ['toolbar-label'],
                toolTip: "_DelUserTooltip".loc(),
                isEnabledBinding: SC.Binding.oneWay('Tasks.usersController.hasSelection'),
                target: 'Tasks',
                action: 'deleteUser'
              })

            ]
          }),
        
          // FIXME: [SC] Beta: keep current user selected in master list when name is changed on detail panel
          SC.ScrollView.design({
            layout: { top: 35, bottom: 0, left: 0, width: 200 },
            hasHorizontalScroller: NO,
            classNames: ['users-pane'],

            contentView: SC.ListView.design({
              layout: { top: 0, left:0, bottom: 0, right: 0 },
              contentValueKey: 'name',
              contentBinding: 'Tasks.usersController.arrangedObjects',
              selectionBinding: 'Tasks.usersController.selection',
              localize: YES,
              rowHeight: 22,
              exampleView: Tasks.UserItemView,
              classNames: ['users-pane-inner']
            })
          }),
          
          Tasks.UserInformationView.design({
            layout: { top: 40, left: 200, bottom: 35, right: 10 },
            contentBinding: 'Tasks.userController'
          })
                
        ]
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
      
  })
  
});