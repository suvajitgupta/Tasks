/**
 * State to manage application termination.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki SCUDS */

Tasks.ShutDownState = Ki.State.extend({
  
  _terminated: false, // this is set to true when Tasks shuts down
  
  enterState: function() {

    // Clear cached localStorage data (if any)
    if(CoreTasks.get('useLocalStorage')) {
      // TODO: [SG] add checkbox on logout screen to optionally clear localStorage
      // console.log('DEBUG: clearing cached localStorage data');
      SCUDS.LocalStorageAdapterFactory.nukeAllAdapters();
    }

    // Logout user on Server (if needed) and restart application
    if(Tasks.get('serverType') === Tasks.GAE_SERVER) {
      var params = {
        successCallback: this._logoutSuccess.bind(this),
        failureCallback: this._logoutFailure.bind(this)
      };
      params.queryParams = {
        UUID: CoreTasks.getPath('currentUser.id'),
        authToken: CoreTasks.getPath('currentUser.authToken')
      };
      // notify Server so that authentication token can be destroyed for security reasons
      CoreTasks.executeTransientPost('logout', null, params);
    }
    else {
      this.set('_terminated', true);
    }
    
  },

  _logoutSuccess: function(response) {
    // console.log('DEBUG: Logout succeeded on Server');
    this.set('_terminated', true);
  },

  _logoutFailure: function(response) {
    console.error('Logout failed on Server');
    this.set('_terminated', true);
  },
  
  _needsSaveBinding: SC.Binding.oneWay('CoreTasks.needsSave'),
  _needsSaveDidChange: function() {
    // console.log('_restart() terminated=' + this._terminated + ', needsSave=' + this._needsSave);
    if(this._terminated && !this._needsSave) { // restart Tasks only if terminated and changes are saved
      window.location = Tasks.getBaseUrl();
    }
  }.observes('_terminated', '_needsSave')
    
});
