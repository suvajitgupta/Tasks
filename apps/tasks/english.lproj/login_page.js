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
      childViews: 'loginPromptLabel loginNameLabel loginNameField passwordLabel passwordField loginErrorMessage cancelButton loginButton signup'.w(),
      
      loginPromptLabel: SC.LabelView.design({
        layout: { top: 65, left: 255, width: 250, height: 24 },
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
        classNames: ['login-name'],
        valueBinding: 'Tasks.loginController.loginName'
      }),
      
      passwordLabel: SC.LabelView.design({
        layout: { top: 158, left: 200, width: 125, height: 18 },
        classNames: ['login-label'],
        textAlign: SC.ALIGN_RIGHT,
        value: "_Password:".loc() 
      }),
      // TODO: [SG] Beta: see how to mask password as it is entered on screen
      passwordField: SC.TextFieldView.design({
        layout: { top: 154, left: 344, width: 246, height: 26 },
        classNames: ['login-name'],
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
      }),
      
      signup: SC.LabelView.design(SCUI.SimpleButton,{
        layout: { top: 235, left: 500, height: 24, width: 200 },
        classNames: ['sign-up'],
        value: "_NewUserSignup".loc(),
        target: 'Tasks',
        action: 'launchSignupPane'
      })
      
    }),
    
    // FIXME: [SG] Beta: see why cursor is not blinking in this field at startup as it used to before
    focus: function() {
      this.contentView.loginNameField.becomeFirstResponder();        
    }
    
  })
    
});