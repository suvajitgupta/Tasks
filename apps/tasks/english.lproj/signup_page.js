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
    layout: { centerX: 0, width: 415, centerY: 0, height: 220 },
    
    defaultResponder: Tasks.SIGNUP,

    contentView: SC.View.design({
      
      childViews: "prompt userInformation signupButton cancelButton".w(),
      
      prompt: SC.LabelView.design({
        layout: { top: 5, left: 10, height: 18, right: 10 },
         value: "_SignupPrompt".loc()
      }),
      
      userInformation: Tasks.UserInformationView.design({
        layout: { top: 20, left: 10, bottom: 35, right: 10 },
        isRoleChangeable: NO,
        contentBinding: 'Tasks.signupController'
      }),
      
      // FIXME: [SG] Beta: see why you can't signup more than 1 user each time Tasks loads
      signupButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 10, width: 90, height: 24 },
        title: "_Signup".loc(),
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