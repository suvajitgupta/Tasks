// ==========================================================================
// Tasks.settingsPage
// ==========================================================================
/*globals CoreTasks Tasks sc_require */
sc_require('core');

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  
  Settings Panel
  
*/
Tasks.settingsPage = SC.Page.create({  
  
  panel: SC.PanelPane.create({
    
    layout: { centerX: 0, centerY: 0, height: 325, width: 550 },
    
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
                layout: { top: 5, left: 5, height: 24, width: 90 },
                icon: 'task-add-icon',
                value: "_AddUser".loc(),
                classNames: ['toolbar-label'],
                toolTip: "_AddUserTooltip".loc(),
                target: 'Tasks',
                action: 'addUser'
              }),

              SC.LabelView.design(Tasks.SimpleButton,{
                layout: { top: 5, left: 100, height: 24, width: 90 },
                icon: 'task-del-icon',
                value: "_DelUser".loc(),
                classNames: ['toolbar-label'],
                toolTip: "_DelUserTooltip".loc(),
                isEnabledBinding: SC.Binding.oneWay('Tasks.usersController.hasSelection'),
                target: 'Tasks',
                action: 'deleteUser'
              })

            ]
          }),
        
          SC.ScrollView.design({
            layout: { top: 35, bottom: 0, left: 0, width: 200 },
            hasHorizontalScroller: NO,
            classNames: ['users-pane'],

            contentView: SC.ListView.design({
              layout: { top: 0, left:0, bottom: 0, right: 0 },
              contentValueKey: 'displayName',
              contentBinding: 'Tasks.usersController.arrangedObjects',
              selectionBinding: 'Tasks.usersController.selection',
              localize: YES,
              rowHeight: 22,
              classNames: ['users-pane-inner']
            })
          }),
          
          SC.LabelView.design({
            layout: { top: 100, left: 210, height: 17, width: 80 },
            textAlign: SC.ALIGN_RIGHT,
            value: "_LoginName:".loc()
          }),
          SC.TextFieldView.design({
            layout: { top: 100, left: 300, height: 16, width: 150 },
            valueBinding: SC.binding('Tasks.userController.loginName', this)
          }),

          SC.LabelView.design({
            layout: { top: 135, left: 210, height: 17, width: 80 },
            textAlign: SC.ALIGN_RIGHT,
            value: "_FullName:".loc()
          }),
          SC.TextFieldView.design({
            layout: { top: 135, left: 300, height: 16, width: 200 },
            valueBinding: SC.binding('Tasks.userController.name', this)
          }),
          
          SC.LabelView.design({
            layout: { top: 170, left: 210, height: 17, width: 80 },
            textAlign: SC.ALIGN_RIGHT,
            value: "_Role:".loc()
          }),
          SC.SelectFieldView.design({
            layout: { top: 170, left: 300, height: 20, width: 100 },
            localize: YES,
            objects: CoreTasks.roles,
            valueBinding: 'Tasks.userController.role'
          })          
                
        ]
      }),
      
      closeButton: SC.ButtonView.design({
        layout: { width: 80, height: 30, right: 10, bottom: 8 },
        titleMinWidth: 0,
        keyEquivalent: 'return',
        isDefault: YES,
        theme: 'capsule',
        title: "_Close".loc(),
        target: 'Tasks.settingsController',
        action: 'closePanel'
      })
      
    })
      
  })
  
});