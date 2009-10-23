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
  
  createChildViews: function() {
    
    var childViews = [];
    
    childViews.push(this.createChildView(SC.LabelView.design({
      layout: { top: 10, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_LoginName:".loc() 
    })));
    childViews.push(this.createChildView(SC.TextFieldView.design({
      layout: { top: 10, left: 90, height: 20, width: 200 },
      hint: "_Initials".loc(),
      valueBinding: SC.binding('.content.loginName', this).toLocale()
    })));
    
    childViews.push(this.createChildView(SC.LabelView.design({
      layout: { top: 42, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_FullName:".loc() 
    })));
    childViews.push(this.createChildView(SC.TextFieldView.design({
      layout: { top: 42, left: 90, height: 20, width: 200 },
      hint: "_FirstLast".loc(),
      valueBinding: SC.binding('.content.name', this).toLocale()
    })));
    
    childViews.push(this.createChildView(SC.LabelView.design({
      layout: { top: 74, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Role:".loc()
    })));
    childViews.push(this.createChildView(SC.SelectFieldView.design({
      layout: { top: 74, left: 90, height: 20, width: 200 },
      localize: YES,
      objects: CoreTasks.roles,
      valueBinding: SC.binding('.content.role', this)
    })));
    
    childViews.push(this.createChildView(SC.LabelView.design({
      layout: { top: 106, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Email:".loc()
    })));
    childViews.push(this.createChildView(SC.TextFieldView.design(SC.Validatable,{
      layout: { top: 106, left: 90, height: 20, width: 275 },
      validator: SC.Validator.EmailOrEmpty,
      errorLabel: "_InvalidEmailAddress".loc(),
      hint: "_EmailAddress".loc(),
      valueBinding: SC.binding('.content.emailAddress', this).toLocale()
    })));
    
    childViews.push(this.createChildView(SC.LabelView.design({
      layout: { top: 138, left: 0, width: 85, height: 18 },
      textAlign: SC.ALIGN_RIGHT,
      value: "_Password:".loc()
    })));
    childViews.push(this.createChildView(SC.TextFieldView.design({
      layout: { top: 138, left: 90, height: 20, width: 200 },
      hint: "_PasswordHint".loc(),
      isPassword: YES,
      valueBinding: SC.binding('.content.password', this).toLocale()
    })));
    
    this.set('childViews', childViews);
    
  }

});