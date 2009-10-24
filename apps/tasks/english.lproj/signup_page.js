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
    layout: { centerX: 0, width: 415, centerY: 0, height: 225 },
    
    defaultResponder: Tasks.SIGNUP,

    contentView: SC.View.design({
      
      childViews: "prompt userInformation signupButton cancelButton".w(),
      
      prompt: SC.LabelView.design({
        layout: { top: 5, left: 10, height: 25, right: 10 },
        textAlign: SC.ALIGN_CENTER,
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_SignupPaneTitle".loc()
      }),
      
      userInformation: Tasks.UserInformationView.design({
        layout: { top: 25, left: 10, bottom: 35, right: 10 },
        contentBinding: 'Tasks.signupController'
      }),
      
      signupButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 10, width: 90, height: 24 },
        title: "_Signup".loc(),
        theme: 'capsule',
        keyEquivalent: 'return',
        isDefault: YES,
        action: "submit",
        isEnabledBinding: SC.Binding.oneWay('Tasks.userController.password').bool()
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