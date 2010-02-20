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
  
  _listRoles: function() {
     var ret = [];
     ret.push({ name: CoreTasks.USER_ROLE_MANAGER, value: CoreTasks.USER_ROLE_MANAGER });
     ret.push({ name: Tasks.softwareMode? CoreTasks.USER_ROLE_DEVELOPER : "_User", value: CoreTasks.USER_ROLE_DEVELOPER });
     if(Tasks.softwareMode) ret.push({ name: CoreTasks.USER_ROLE_TESTER, value: CoreTasks.USER_ROLE_TESTER });
     ret.push({ name: CoreTasks.USER_ROLE_GUEST, value: CoreTasks.USER_ROLE_GUEST });
     return ret;
  },

  createChildViews: function() {
    
    var childViews = [];
    
    this.fullNameLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 10, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_FullName:".loc() 
    }));
    childViews.push(this.fullNameLabel);
    this.fullNameField = this.createChildView(SC.TextFieldView.extend({
      layout: { top: 10, left: 90, height: 20, width: 300 },
      hint: "_FirstLast".loc(),
      valueBinding: SC.binding('*content.name', this).toLocale()
    }));
    childViews.push(this.fullNameField);
    
    this.loginNameLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 42, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_LoginName:".loc() 
    }));
    childViews.push(this.loginNameLabel);
    this.loginNameField = this.createChildView(SC.TextFieldView.extend({
      layout: { top: 42, left: 90, height: 20, width: 300 },
      hint: "_Initials".loc(),
      valueBinding: SC.binding('*content.loginName', this).toLocale()
    }));
    childViews.push(this.loginNameField);
    
    this.roleLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 74, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Role:".loc()
    }));
    childViews.push(this.roleLabel);
    this.roleField = this.createChildView(SC.SelectFieldView.extend({
      layout: { top: 74, left: 90, height: 20, width: 300 },
      localize: YES,
      nameKey: 'name',
      valueKey: 'value',
      objects: this._listRoles(),
      valueBinding: SC.binding('*content.role', this),
      isEnabledBinding: 'CoreTasks.permissions.canUpdateUserRole'
    }));
    childViews.push(this.roleField);
    
    this.emailLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 106, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Email:".loc()
    }));
    childViews.push(this.emailLabel);
    this.emailField = this.createChildView(SC.TextFieldView.extend(SC.Validatable,{
      layout: { top: 106, left: 90, height: 20, width: 300 },
      validator: SC.Validator.EmailOrEmpty,
      errorLabel: "_InvalidEmailAddress".loc(),
      hint: "_EmailAddress".loc(),
      valueBinding: SC.binding('*content.email', this).toLocale()
    }));
    childViews.push(this.emailField);
    
    this.passwordLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 138, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Password:".loc()
    }));
    childViews.push(this.passwordLabel);
    this.passwordField = this.createChildView(SC.TextFieldView.extend({
      layout: { top: 138, left: 90, height: 20, width: 300 },
      isPassword: YES,
      hint: "_PasswordHint".loc(),
      isPassword: YES,
      valueBinding: SC.binding('*content.unhashedPassword', this).toLocale()
    }));
    childViews.push(this.passwordField);
    
    this.set('childViews', childViews);
    
  }

});