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
  
  isRoleChangeable: YES,
  
  createChildViews: function() {
    
    var childViews = [];
    
    this.fullNameLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 10, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_FullName:".loc() 
    }));
    childViews.push(this.fullNameLabel);
    this.fullNameField = this.createChildView(SC.TextFieldView.extend({
      layout: { top: 10, left: 90, height: 20, width: 200 },
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
      layout: { top: 42, left: 90, height: 20, width: 200 },
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
      layout: { top: 74, left: 90, height: 20, width: 200 },
      localize: YES,
      objects: CoreTasks.roles,
      valueBinding: SC.binding('*content.role', this),
      isEnabledBinding: SC.binding('*isRoleChangeable', this)
    }));
    childViews.push(this.roleField);
    
    this.emailLabel = this.createChildView(SC.LabelView.extend({
      layout: { top: 106, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Email:".loc()
    }));
    childViews.push(this.emailLabel);
    this.emailField = this.createChildView(SC.TextFieldView.extend(SC.Validatable,{
      layout: { top: 106, left: 90, height: 20, width: 275 },
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
      layout: { top: 138, left: 90, height: 20, width: 200 },
      hint: "_PasswordHint".loc(),
      isPassword: YES,
      valueBinding: SC.binding('*content.password', this).toLocale()
    }));
    childViews.push(this.passwordField);
    
    this.set('childViews', childViews);
    
  }

});