//============================================================================
// Tasks.SIGNUP
//============================================================================
/*globals CoreTasks Tasks*/
/**

  This will serve as the responder to all signup actions
  
  @extends SC.Responder
  @author Joshua Holt [JH2]
  @version preBeta
  @since preBeta

*/

Tasks.SIGNUP = SC.Responder.create({
  
  // when we become first responder, always show the signup panel
  didBecomeFirstResponder: function() {
    // Create a new user and push it onto the users controller and select it
    // so that we can edit it.
    
    // Use a nested store to buffer changes so that we can discard etc..
    var store, user, pane;
    store = this._store = CoreTasks.get('store').chain(); 
    user = store.createRecord(CoreTasks.User, SC.clone(CoreTasks.User.NEW_USER_HASH));
                                  
    Tasks.signupController.set('content',user);
    
    // then show the dialog
    pane = Tasks.getPath('signupPage.mainPane');
    // show on screen
    pane.append();
    // focus first field
    pane.makeFirstResponder(pane.contentView.loginName);
  },
  
  // when we lose first responder, always hide the signup panel.
  // willLoseFirstResponder: function() {
  //   
  //   // if we still have a store, then cancel first.
  //   if (this._store) {
  //     this._store.discardChanges();
  //     this._store = null ;
  //   }
  //   // cleanup controller
  //   Tasks.userController.set('content', null);
  //   // Hide signup panel
  //   Tasks.getPath('signupPage.mainPane').remove();
  //   this.refocusLoginPanel();
  // },
  
  // called when the OK button is pressed.
  submit: function() {
    this._store.commitChanges();
    this._store = null ;
    
    // Save the new user
    Tasks.saveData();
    Tasks.getPath('signupPage.mainPane').remove();
    this.refocusLoginPanel();
  },
  
  // called when the Cancel button is pressed
  cancel: function() {
    this._store.discardChanges();
    this._store = null;

    // reset app
    Tasks.getPath('signupPage.mainPane').remove();
    this.refocusLoginPanel();
  },
  
  refocusLoginPanel: function(){
    var panel = Tasks.getPath('loginPage.panel');
    if(panel) {
      panel.focus();
    }
  }
  
});