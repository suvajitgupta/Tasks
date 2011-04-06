// ==========================================================================
// Tasks.userController
// ==========================================================================
/*globals CoreTasks Tasks sc_require */
sc_require('lib/sha1');

/** 

  This controller tracks the selected User

  @extends SC.ObjectController
	@author Suvajit Gupta
*/
Tasks.userController = SC.ObjectController.create(Tasks.Sha1,
/** @scope Tasks.userController.prototype */ {
  
  contentBinding: SC.Binding.oneWay('Tasks.usersController.selection'),
  
  loginNameErrorMessage: '',
  emailErrorMessage: '',
  
  isValidUserName: function() {
    var name = this.get('name');
    if(name === '' || name === CoreTasks.NEW_USER_NAME.loc()) return false;
    var loginName = this.get('loginName');
    if(loginName === '' || loginName === CoreTasks.NEW_USER_LOGIN_NAME.loc()) return false;
    return true;
  }.property('name', 'loginName').cacheable(),
  
  canUpdateUserRole: function() {
    var content = this.get('content');
    if(SC.none(content) || content.get('length') !== 1 || content.get('firstObject') === CoreTasks.get('currentUser')) return false;
    return CoreTasks.getPath('permissions.canUpdateUserRole');
  }.property('content').cacheable(),
  
  displayLoginNameError: function() {
    this.set('loginNameErrorMessage', "_InUse".loc());
  },
  clearLoginNameError: function() {
    this.set('loginNameErrorMessage', '');
  },

  displayEmailError: function() {
    this.set('emailErrorMessage', "_Invalid".loc());
  },
  clearEmailError: function() {
    this.set('emailErrorMessage', '');
  },

  _emailDidChange: function() {
    this.set('emailErrorMessage', '');
  }.observes('.content.email'),
  
  _loginNameDidChange: function() {
    this.set('loginNameErrorMessage', '');
  }.observes('.content.loginName'),
  
  _unhashedPassword: '',
  unhashedPassword: function(key, value) {
    if (value !== undefined) {
      this._unhashedPassword = value;
      this.set('password', this.hashPassword(value));
    } else {
      if(!SC.empty(this._unhashedPassword)) return this._unhashedPassword;
      return this.get('password')? 'password' : '';
    }
  }.property(),
  
  hashPassword: function(password) {
    return password? this.sha1Hash(password) : '';
  },
  
  _userSelectionDidChange: function() {
    // console.log('DEBUG: userSelectionDidChange() was: ' + (this._selected? this._selected.get('name') : '(none)'));
    if(this.getPath('content.length') !== 1) return;
    var lastSelected = this._selected, currentSelected = this.get('content');
    if (currentSelected && currentSelected.firstObject) currentSelected = currentSelected.firstObject();
    if (lastSelected !== currentSelected) {
      // console.log('DEBUG: userSelectionDidChange() to: ' + currentSelected.get('name'));
      if(lastSelected && (lastSelected.getPath('name') === CoreTasks.NEW_USER_NAME.loc() ||
         lastSelected.getPath('loginName') === CoreTasks.NEW_USER_LOGIN_NAME.loc())) {
        lastSelected.destroy(); // blow away unmodified new user
      }
      this._selected = currentSelected;
    }
  }.observes('content')
  
});
