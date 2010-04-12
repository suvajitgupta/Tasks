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
    layout: { centerX: 0, centerY: 0, height: 296, width: 843 },
    classNames: ['login-page'],
    
    contentView: SC.View.design({
      
      layout: { top: 0, bottom: 0, left: 0, right: 0 },
      classNames: ['login-body'],
      childViews: 'loginPromptLabel loginNameLabel loginNameField passwordLabel passwordField loginErrorMessage cancelButton loginButton guestSignupButton'.w(),
      
      guestSignupButton: document.title.match(/Dev|Demo|SproutCore|Greenhouse/)? SC.LabelView.design(SCUI.SimpleButton,{
        layout: { top: 67, left: 530, height: 16, width: 140 },
        classNames: ['sign-up'],
        textAlign: SC.ALIGN_CENTER,
        icon: 'user-role-guest',
        value: "_GuestSignup".loc(),
        target: 'Tasks',
        action: 'launchSignupPane'
      }) : SC.View.design({ layout: { top: 70, left: 520, height: 1, width: 1 } }),
      
      loginPromptLabel: SC.LabelView.design({
        layout: { top: 65, left: 255, width: 250, height: 30 },
        classNames: ['login-prompt'],
        value: "_LoginPrompt".loc() 
      }),
      
      loginNameLabel: SC.LabelView.design({
        layout: { top: 115, left: 200, width: 125, height: 18 },
        classNames: ['login-label'],
        textAlign: SC.ALIGN_RIGHT,
        value: "_LoginName:".loc() 
      }),
      loginNameField: SC.TextFieldView.design({
        layout: { top: 113, left: 344, width: 246, height: 26 },
        classNames: ['login-field'],
        valueBinding: 'Tasks.loginController.loginName'
      }),
      
      passwordLabel: SC.LabelView.design({
        layout: { top: 158, left: 200, width: 125, height: 18 },
        classNames: ['login-label'],
        textAlign: SC.ALIGN_RIGHT,
        value: "_Password:".loc() 
      }),
      passwordField: SC.TextFieldView.design({
        layout: { top: 154, left: 344, width: 246, height: 26 },
        isPassword: YES,
        classNames: ['login-field'],
        valueBinding: 'Tasks.loginController.password'
      }),
      
      loginErrorMessage: SC.LabelView.design({
        layout: { top: 195, left: 200, width: 250, height: 20 },
        classNames: ['error-message'],
        value: "_LoginError".loc(),
        isVisibleBinding: SC.Binding.oneWay('Tasks.loginController.loginError').bool()
      }),
      
      cancelButton: SC.ButtonView.design({
        layout: { top: 195, left: 502, width: 80, height: 24 },
        titleMinWidth: 0,
        theme: 'capsule',
        isCancel: YES,
        title: "_Cancel".loc(),
        target: 'Tasks.loginController',
        action: 'cancel'
      }),
      
      loginButton: SC.ButtonView.design({
        layout: { top: 195, left: 588, width: 80, height: 24 },
        titleMinWidth: 0,
        isEnabledBinding: SC.Binding.oneWay('Tasks.loginController.loginName').bool(),
        theme: 'capsule',
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