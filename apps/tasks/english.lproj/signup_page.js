//============================================================================
// Tasks.signupPage
//============================================================================
/*globals CoreTasks Tasks sc_require*/
sc_require('core');
/**

  This is the signup page for Tasks
  
  @extends SC.Page
  @author Joshua Holt
  @version preBeta
  @since preBeta

*/

Tasks.signupPage = SC.Page.design({
  // The main signup pane.  used to show info
  mainPane: SC.PanelPane.design({
    layout: { centerX: 0, width: 420, centerY: 0, height: 215 },
    
    defaultResponder: Tasks.SIGNUP,

    contentView: SC.View.design({
      
      childViews: "signupPrompt userInformation signupButton cancelButton".w(),
      
      signupPrompt: SC.LabelView.design({
        layout: { top: 5, left: 10, height: 24, right: 10 },
        classNames: ['login-label'],
        fontWeight: SC.BOLD_WEIGHT,
        textAlign: SC.ALIGN_CENTER,
        icon: 'user-role-guest',
        value: "_GuestSignup".loc()
      }),
      
      userInformation: Tasks.UserInformationView.design({
        layout: { top: 26, left: 10, bottom: 35, right: 10 },
        isRoleChangeable: NO,
        contentBinding: 'Tasks.signupController'
      }),
      
      signupButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 10, width: 90, height: 24 },
        title: "_Signup".loc(),
        isEnabledBinding: 'Tasks.signupController.isValidUserName',
        theme: 'capsule',
        keyEquivalent: 'return',
        isDefault: YES,
        action: "submit"
      }),
      
      cancelButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 110, width: 90, height: 24 },
        title: "_Cancel".loc(),
        theme: 'capsule',
        keyEquivalent: 'escape',
        isCancel: YES,
        action: "cancel"
      })
      
    })
  })
});