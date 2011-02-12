// ==========================================================================
// Tasks.loginPage
// ==========================================================================
/*globals Tasks sc_require SCUI */

/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  @author Matt Grantham
  
  Import Data Panel
  
*/
Tasks.loginPage = SC.Page.create({
  
  panel: SC.PanelPane.create({
    
    layout: { top: 0, bottom: 0, left: 0, right: 0 },
    classNames: ['login-page'],
    
    contentView: SC.View.design({
      
      layout: { centerX: 0, centerY: 0, width: 390, height: 225 },
      classNames: ['login-body'],
      childViews: 'tasksLogo guestSignupButton loginNameField passwordField authenticatingMessageLabel loginErrorMessageLabel loadDoneProjectDataCheckbox signinButton'.w(),
      
      tasksLogo: Tasks.LogoView.design({
        layout: { left: 20, width: 185, top: 0, height: 56 },
        logo: 'tasks-logo-large',
        version: Tasks.VERSION
      }),
      
      guestSignupButton: Tasks.guestSignup? SC.ButtonView.design({
        layout: { top: 20, right: 0, height: 23, width: 155 },
        classNames: ['dark'],
        icon: 'user-role-guest',
        title: "_GuestSignUp".loc() + '...',
        action: 'signup'
      }) : SC.View.design({ layout: { top: 70, left: 520, height: 1, width: 1 } }),
      
      loginNameField: SC.TextFieldView.design({
        layout: { top: 80, left: 60, right: 0, height: 32 },
        hint: '_LoginNameHint'.loc(),
        valueBinding: 'Tasks.loginController.loginName'
      }),
      
      passwordField: SC.TextFieldView.design({
        layout: { top: 126, left: 60, right: 0, height: 32 },
        isPassword: YES,
        hint: '_PasswordHint'.loc(),
        valueBinding: 'Tasks.loginController.password'
      }),
      
      authenticatingMessageLabel: SC.LabelView.design({
        layout: { top: 170, left: 60, right: 0, height: 20 },
        textAlign: SC.ALIGN_CENTER,
        isVisible: NO,
        value: "_Authenticating".loc(),
        icon: 'progress-icon'
      }),
      
      loginErrorMessageLabel: SC.LabelView.design({
        layout: { top: 170, left: 60, right: 0, height: 20 },
        classNames: ['error-message'],
        textAlign: SC.ALIGN_CENTER,
        valueBinding: SC.Binding.oneWay('Tasks.loginController.loginErrorMessage')
      }),
      
      loadDoneProjectDataCheckbox: SC.CheckboxView.design({
        layout: { bottom: 0, left: 60, width: 250, height: 20 },
        valueBinding: 'Tasks.loadDoneProjectData',
        title: "_LoadDoneProjectData".loc()
      }),
      
      signinButton: SC.ButtonView.design({
        layout: { bottom: 0, right: 0, width: 80, height: 24 },
        titleMinWidth: 0,
        isEnabledBinding: SC.Binding.oneWay('Tasks.loginController.loginName').bool(),
        isDefault: YES,
        title: "_SignIn".loc(),
        action: 'signin'
      })
            
    }),
    
    focus: function() {
      this.contentView.loginNameField.becomeFirstResponder();        
    },
    
    setAuthenticatingMessageVisibility: function(isVisible) {
      this.contentView.authenticatingMessageLabel.set('isVisible', isVisible);
    }
    
  })
    
});