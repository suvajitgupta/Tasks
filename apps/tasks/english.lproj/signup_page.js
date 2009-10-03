//============================================================================
// Tasks.signupPage
//============================================================================
sc_require('core');
/*globals CoreTasks Tasks*/
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
    layout: { centerX: 0, width: 430, centerY: 0, height: 200 },
    
    defaultResponder: Tasks.SIGNUP,

    contentView: SC.View.design({
      
      childViews: "prompt signUpButton cancelButton personalLabel loginName fullName emailLabel emailField roleLabel roleSelect".w(),
      
      // PROMPT
      prompt: SC.LabelView.design({
        layout: { top: 10, left: 20, height: 18, right: 20 },
        value: "_SignupPrompt".loc()
      }),
      
      // INPUTS 
      
      personalLabel: SC.LabelView.design({
        layout: { top: 40, left: 20, width: 70, height: 18 },
        textAlign: SC.ALIGN_RIGHT,
        value: "_User Info:".loc() 
      }),
      
      loginName: SC.TextFieldView.design({
        layout: { top: 40, left: 100, height: 20, width: 150 },
        hint: "_Initials".loc(),
        valueBinding: SC.binding('Tasks.signupController.loginName').toLocale()
      }),

      fullName: SC.TextFieldView.design({
        layout: { top: 40, left: 260, height: 20, width: 150 },
        hint: "_FirstLast".loc(),
        valueBinding: SC.binding('Tasks.signupController.name').toLocale()
      }),
      
      emailLabel: SC.LabelView.design({
        layout: { top: 72, left: 20, width: 70, height: 18 },
        textAlign: SC.ALIGN_RIGHT,
        value: "_Email:".loc()
      }),
      
      emailField: SC.TextFieldView.design(SC.Validatable,{
        layout: { top: 72, left: 100, height: 20, width: 310 },
        validator: SC.Validator.EmailOrEmpty,
        errorLabel: "_InvalidEmailAddress".loc(),
        hint: "_EmailAddress".loc(),
        valueBinding: SC.binding('Tasks.signupController.emailAddress').toLocale()
      }),
      
      roleLabel: SC.LabelView.design({
        layout: { top: 104, left: 20, width: 70, height: 18 },
        textAlign: SC.ALIGN_RIGHT,
        value: "_Role:".loc()
      }),
      
      roleSelect: SC.SelectFieldView.design({
        layout: { top: 104, left: 97, height: 20, width: 318 },
        localize: YES,
        objects: CoreTasks.roles,
        valueBinding: 'Tasks.signupController.role'
      }),
      
      // BUTTONS
      signUpButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 15, width: 90, height: 24 },
        title: "_Signup".loc(),
        theme: 'capsule',
        isDefault: YES,
        action: "submit"
      }),
      
      cancelButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 115, width: 90, height: 24 },
        title: "_Cancel".loc(),
        theme: 'capsule',
        isCancel: YES,
        action: "cancel"
      })
      
    })
  })
});