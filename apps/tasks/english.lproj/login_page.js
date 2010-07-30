// ==========================================================================
// Tasks.importData
// ==========================================================================
/*globals Tasks sc_require SCUI */
sc_require('core');

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
      
      layout: { centerX: 0, centerY: 0, width: 390, height: 196 },
      classNames: ['login-body'],
      childViews: 'logo loginNameField passwordField loginErrorMessageLabel loginButton guestSignupButton'.w(),
      
      logo: SC.View.design({
        layout: { top: 0, left: 10, width: 153, height: 56 },
        classNames: ['tasks-logo-large']
      }),
      
      guestSignupButton: document.title.match(/Dev|Demo|SproutCore|Greenhouse/)? SC.ButtonView.design({
        layout: { top: 20, right: 0, height: 23, width: 145 },
        classNames: ['dark'],
        icon: 'user-role-guest',
        title: "_GuestSignup".loc() + '...',
        target: 'Tasks',
        action: 'launchSignupPane'
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
      
      loginErrorMessageLabel: SC.LabelView.design({
        layout: { top: 175, left: 60, width: 240, height: 20 },
        classNames: ['error-message'],
        valueBinding: SC.Binding.oneWay('Tasks.loginController.loginErrorMessage')
      }),
      
      loginButton: SC.ButtonView.design({
        layout: { bottom: 0, right: 0, width: 80, height: 24 },
        titleMinWidth: 0,
        isEnabledBinding: SC.Binding.oneWay('Tasks.loginController.loginName').bool(),
        isDefault: YES,
        title: "_Login".loc(),
        target: 'Tasks.loginController',
        action: 'login'
      })
            
    }),
    
    focus: function() {
      this.contentView.loginNameField.becomeFirstResponder();        
    }
    
  })
    
});