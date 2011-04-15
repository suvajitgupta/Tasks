// ==========================================================================
// Project: Tasks
// ==========================================================================
/*globals CoreTasks Tasks */

/** 

  View/edit User information.
  
  @extends SC.View
  @author Suvajit Gupta
*/

Tasks.UserInformationView = SC.View.extend(
/** @scope Tasks.UserInformationView.prototype */ {
  
  contentBinding: 'Tasks.userController',
  
  roles: function() {
     var ret = [];
     ret.push({ name: CoreTasks.USER_ROLE_MANAGER, value: CoreTasks.USER_ROLE_MANAGER, icon: 'user-role-manager' });
     ret.push({ name: Tasks.softwareMode? CoreTasks.USER_ROLE_DEVELOPER : "_User", value: CoreTasks.USER_ROLE_DEVELOPER, icon: 'user-role-developer' });
     if(Tasks.softwareMode) ret.push({ name: CoreTasks.USER_ROLE_TESTER, value: CoreTasks.USER_ROLE_TESTER, icon: 'user-role-tester' });
     ret.push({ name: CoreTasks.USER_ROLE_GUEST, value: CoreTasks.USER_ROLE_GUEST, icon: 'user-role-guest' });
     return ret;
  },

  createChildViews: function() {
    
    var childViews = [];
    
    this.fullNameLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 10, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_FullName:".loc() 
    }));
    childViews.push(this.fullNameLabel);
    this.fullNameField = this.createChildView(SC.TextFieldView.design({
      layout: { top: 10, left: 90, height: 20, width: 300 },
      hint: "_FirstnameLastname".loc(),
      valueBinding: SC.binding('*content.name', this).toLocale()
    }));
    childViews.push(this.fullNameField);
    
    this.loginNameLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 42, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_LoginName:".loc() 
    }));
    childViews.push(this.loginNameLabel);
    this.loginNameField = this.createChildView(SC.TextFieldView.design({
      layout: { top: 42, left: 90, height: 20, width: 300 },
      hint: "_Initials".loc(),
      valueBinding: SC.binding('*content.loginNameValue', this).toLocale(),
      keyUp: function(evt) {
        var user = Tasks.usersController.getPath('selection.firstObject');
        if(CoreTasks.isLoginNameValid(user)) Tasks.userController.clearLoginNameError();
        else Tasks.userController.displayLoginNameError();
        sc_super();
      }
    }));
    childViews.push(this.loginNameField);
    this.loginNameErrorMessageLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 42, left: 395, height: 20, width: 45 },
      classNames: ['error-message'],
      valueBinding: SC.Binding.oneWay('Tasks.userController.loginNameErrorMessage')
    }));
    childViews.push(this.loginNameErrorMessageLabel);
    
    this.passwordLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 74, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Password:".loc(),
      icon: 'password-icon'
    }));
    childViews.push(this.passwordLabel);
    this.passwordField = this.createChildView(SC.TextFieldView.design({
      layout: { top: 74, left: 90, height: 20, width: 300 },
      isPassword: YES,
      hint: "_PasswordHint".loc(),
      isPassword: YES,
      valueBinding: SC.binding('*content.unhashedPassword', this).toLocale()
    }));
    childViews.push(this.passwordField);
    
    this.emailLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 106, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Email:".loc(),
      icon: 'email-icon'
    }));
    childViews.push(this.emailLabel);
    this.emailField = this.createChildView(SC.TextFieldView.design(SC.Validatable,{
      layout: { top: 106, left: 90, height: 20, width: 300 },
      errorLabel: "_InvalidEmailAddress".loc(),
      hint: "_EmailAddress".loc(),
      valueBinding: SC.binding('*content.email', this).toLocale(),
      keyUp: function(evt) {
        var email = Tasks.userController.get('email');
        if(email && !CoreTasks.User.isValidEmail(email)) Tasks.userController.displayEmailError();
        else Tasks.userController.clearEmailError();
        sc_super();
      }
    }));
    childViews.push(this.emailField);
    this.emailErrorMessageLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 106, left: 395, height: 20, width: 45 },
      classNames: ['error-message'],
      valueBinding: SC.Binding.oneWay('Tasks.userController.emailErrorMessage')
    }));
    childViews.push(this.emailErrorMessageLabel);
    this.emailHelpLabel =  this.createChildView(SC.LabelView.design({
      layout: { top: 131, left: 90, height: 20, width: 300 },
      escapeHTML: NO,
      classNames: ['onscreen-help'],
      value: "_EmailOnscreenHelp".loc()
    }));
    childViews.push(this.emailHelpLabel);
    
    this.gravatarLabel = this.createChildView(SC.LabelView.design(SCUI.SimpleButton, {
      layout: { top: 162, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      escapeHTML: NO,
      value: '<u style="color: blue">' + "_Gravatar:".loc() + '</u>',
      action: 'window.open("http://www.gravatar.com");'
    }));
    childViews.push(this.gravatarLabel);
    this.gravatarImage = this.createChildView(SC.ImageView.design({
      layout: { top: 151, left: 91 },
      classNames: ['gravatar'],
      textAlign: SC.ALIGN_RIGHT,
      valueBinding: SC.binding('*content.icon', this)
    }));
    childViews.push(this.gravatarImage);

    this.roleLabel = this.createChildView(SC.LabelView.design({
      layout: { top: 162, left: 108, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      // isVisibleBinding: 'CoreTasks.permissions.canUpdateUserRole',
      value: "_Role:".loc()
    }));
    childViews.push(this.roleLabel);
    this.roleField = this.createChildView(SC.SelectButtonView.design({
      layout: { top: 159, left: 198, height: 24, width: 130 },
      classNames: ['square'],
      localize: YES,
      isEnabledBinding: 'Tasks.userController.canUpdateUserRole',
      objects: this.roles(),
      nameKey: 'name',
      valueKey: 'value',
      iconKey: 'icon',
      valueBinding: SC.binding('*content.role', this)
    }));
    childViews.push(this.roleField);
    
    this.set('childViews', childViews);
    
  }

});