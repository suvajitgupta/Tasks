//============================================================================
// Tasks.signupPane
//============================================================================
/*globals CoreTasks Tasks sc_require*/

/**

  This is the signup page for Tasks
  
  @extends SC.Page
  @author Joshua Holt
  @version preBeta
  @since preBeta

*/

Tasks.signupPane = SC.PanelPane.create({

  layout: { centerX: 0, width: 310, centerY: 0, height: 260 },
  
  contentView: SC.View.design({
    
    childViews: "signupPrompt userInformation signupButton cancelButton".w(),
    
    signupPrompt: SC.LabelView.design({
      layout: { top: 5, left: 10, height: 24, right: 10 },
      classNames: ['login-label'],
      fontWeight: SC.BOLD_WEIGHT,
      textAlign: SC.ALIGN_CENTER,
      icon: 'user-role-guest',
      value: "_GuestSignUp".loc()
    }),
    
    userInformation: Tasks.UserInformationView.design({
      layout: { top: 26, left: 0, bottom: 35, right: 10 }
    }),
    
    signupButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 10, width: 90, height: 24 },
      title: "_SignUp".loc(),
      isEnabledBinding: 'Tasks.userController.isValidUserName',
      keyEquivalent: 'return',
      isDefault: YES,
      action: 'signup'
    }),
    
    cancelButton: SC.ButtonView.design({
      layout: { bottom: 10, right: 110, width: 90, height: 24 },
      title: "_Cancel".loc(),
      keyEquivalent: 'escape',
      isCancel: YES,
      action: 'cancel'
    })
    
  })

});