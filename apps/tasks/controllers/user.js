// ==========================================================================
// Tasks.userController

// ==========================================================================
/*globals Tasks sc_require */
sc_require('lib/sha1');

/** 

  This controller tracks the selected User

  @extends SC.ObjectController
	@author Suvajit Gupta
*/
Tasks.userController = SC.ObjectController.create(Tasks.Sha1,
/** @scope Tasks.userController.prototype */ {
  
  contentBinding: 'Tasks.usersController.selection',
  
  _unhashedPassword: '',
  unhashedPassword: function(key, value) {
    if (value !== undefined) {
      this._unhashedPassword = value;
      this.set('password', Tasks.userController.hashPassword(value));
    } else {
      return this._unhashedPassword;
    }
  }.property('_unhashedPassword').cacheable(),
  
  hashPassword: function(password) {
    return password? this.sha1Hash(password) : '';
  },
  
  _contentHasChanged: function() {
    var user = this.getPath('content.firstObject');
    if(user) {
      var password = user.get('password');
      this._unhashedPassword = password? 'password' : '';
    }
  }.observes('content')  

});
