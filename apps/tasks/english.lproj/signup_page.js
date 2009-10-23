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
    layout: { centerX: 0, width: 410, centerY: 0, height: 225 },
    
    defaultResponder: Tasks.SIGNUP,

    contentView: SC.View.design({
      
      childViews: "prompt userInformation signUpButton cancelButton".w(),
      
      prompt: SC.LabelView.design({
        layout: { top: 5, left: 10, height: 25, right: 10 },
        textAlign: SC.ALIGN_CENTER,
        controlSize: SC.LARGE_CONTROL_SIZE,
        fontWeight: SC.BOLD_WEIGHT,
        value: "_SignupPaneTitle".loc()
      }),
      
      userInformation: SC.View.design({
        
        layout: { top: 25, left: 10, bottom: 35, right: 10 },
        childViews: "loginNameLabel loginNameField fullNameLabel fullNameField emailLabel emailField passwordLabel passwordField roleLabel roleSelect".w(),
        
        loginNameLabel: SC.LabelView.design({
          layout: { top: 10, left: 0, width: 85, height: 18 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_LoginName:".loc() 
        }),

        loginNameField: SC.TextFieldView.design({
          layout: { top: 10, left: 90, height: 20, width: 200 },
          hint: "_Initials".loc(),
          valueBinding: SC.binding('Tasks.signupController.loginName').toLocale()
        }),

        fullNameLabel: SC.LabelView.design({
          layout: { top: 42, left: 0, width: 85, height: 18 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_FullName:".loc() 
        }),

        fullNameField: SC.TextFieldView.design({
          layout: { top: 42, left: 90, height: 20, width: 200 },
          hint: "_FirstLast".loc(),
          valueBinding: SC.binding('Tasks.signupController.name').toLocale()
        }),

        emailLabel: SC.LabelView.design({
          layout: { top: 74, left: 0, width: 85, height: 18 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Email:".loc()
        }),

        emailField: SC.TextFieldView.design(SC.Validatable,{
          layout: { top: 74, left: 90, height: 20, width: 310 },
          validator: SC.Validator.EmailOrEmpty,
          errorLabel: "_InvalidEmailAddress".loc(),
          hint: "_EmailAddress".loc(),
          valueBinding: SC.binding('Tasks.signupController.emailAddress').toLocale()
        }),

        passwordLabel: SC.LabelView.design({
          layout: { top: 106, left: 0, width: 85, height: 18 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Password:".loc()
        }),

        passwordField: SC.TextFieldView.design({
          layout: { top: 106, left: 90, height: 20, width: 200 },
          hint: "_PasswordHint".loc(),
          isPassword: YES,
          valueBinding: SC.binding('Tasks.signupController.password').toLocale()
        }),

        roleLabel: SC.LabelView.design({
          layout: { top: 138, left: 0, width: 85, height: 18 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Role:".loc()
        }),

        roleSelect: SC.SelectFieldView.design({
          layout: { top: 138, left: 90, height: 20, width: 200 },
          localize: YES,
          objects: CoreTasks.roles,
          valueBinding: 'Tasks.signupController.role'
        })
        
      }),
      
      signUpButton: SC.ButtonView.design({
        layout: { bottom: 10, right: 10, width: 90, height: 24 },
        title: "_Signup".loc(),
        theme: 'capsule',
        keyEquivalent: 'return',
        isDefault: YES,
        action: "submit",
        isEnabledBinding: SC.Binding.oneWay('Tasks.signupController.password').bool()
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