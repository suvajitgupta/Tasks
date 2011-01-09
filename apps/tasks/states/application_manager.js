/**
 * State to handle globally available actions
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki SCUDS */

Tasks.ApplicationManagerState = Ki.State.extend({
      
  initialSubstate: 'ready',
  
  // State indicating global action readiness
  ready: Ki.State.design({
    
    displayUsersSettings: function() {
      this.gotoState('usersSettings');
    },
        
    toggleAutoSave: function(){
      CoreTasks.set('autoSave', !CoreTasks.get('autoSave'));
    },

    toggleSendNotifications: function(){
      CoreTasks.set('sendNotifications', !CoreTasks.get('sendNotifications'));
    },

    displayStatistics: function() {
      this.gotoState('statistics');
    },

    importDataAsText: function() {
      this.gotoState('textImport');
    },

    exportDataAsText: function() {
      this.gotoState('textExport');
    },

    exportDataAsHTML: function() {
      Tasks.exportDataController.exportData('HTML');
    },

    displayHelp: function() {
      if(SC.platform.touch) window.location = Tasks.getHelpUrl();
      else window.open(Tasks.getBaseUrl() + '#help', '', 'width=1000,height=750,menubar=no,location=no,toolbar=no,directories=no,status=no');
    },

    logout: function() {
      var that = this;
      SC.AlertPane.warn("_Confirmation".loc(), "_LogoutConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON1_STATUS) {
              that._checkForChangesAndExit();
            }
          }
        })
      );
    },
    
    _checkForChangesAndExit: function() {
      var that = this;
      if(CoreTasks.get('needsSave')) {
        SC.AlertPane.warn("_Confirmation".loc(), "_SaveConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
          SC.Object.create({
            alertPaneDidDismiss: function(pane, status) {
              if(status === SC.BUTTON1_STATUS) {
                that._saveChangesAndExit();
              }
              else if(status === SC.BUTTON2_STATUS){
                that._exitWithoutSavingChanges();
              }
            }
          })
        );
      }
      else {
        this._exitWithoutSavingChanges();
      }
    },

    _saveChangesAndExit: function() {
      CoreTasks.saveChanges();
      this._terminate();
    },

    _exitWithoutSavingChanges: function() {
      this._terminate();
    },

    _terminate: function() {

      // Shut down and destroy statechart
      Tasks.statechart.gotoState('shutDown');
      Tasks.statechart.destroy();

      // Clear cached localStorage data (if any)
      if(CoreTasks.useLocalStorage) {
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
          ATO: CoreTasks.getPath('currentUser.authToken')
        };
        // notify Server so that authentication token can be destroyed for security reasons
        CoreTasks.executeTransientPost('logout', null, params);
      }
      else {
        this._restart();
      }
    },

    _logoutSuccess: function(response) {
      // console.log('DEBUG: Logout succeeded on Server');
      this._restart();
    },

    _logoutFailure: function(response) {
      console.error('Logout failed on Server');
      this._restart();
    },

    _restart: function() {
      window.location = Tasks.getBaseUrl();
    },
    
    save: function() {
      Tasks.saveData();
    },

    refresh: function() {
      Tasks.loadData();
    }

  }),
  
  // State to handle user info/settings
  usersSettings: Ki.State.design({

    enterState: function() {
      Tasks.settingsController.openPanel();
    },
    
    addUser: function() {

      if(!CoreTasks.getPath('permissions.canCreateUser')) {
        console.warn('You do not have permission to add a user');
        return null;
      }

      // Create and select new user (copy role of selected user if one).
      var userHash = SC.clone(CoreTasks.User.NEW_USER_HASH);
      var selectedUser = Tasks.usersController.getPath('selection.firstObject');
      if (selectedUser) userHash.role = selectedUser.get('role');
      var user = CoreTasks.createRecord(CoreTasks.User, userHash);
      Tasks.usersController.selectObject(user);
      Tasks.settingsPane.get('userInformation').get('fullNameField').becomeFirstResponder();

    },

    deleteUser: function() {
      
      if(!CoreTasks.getPath('permissions.canDeleteUser')) {
        console.warn('You do not have permission to delete a user');
        return;
      }

      var uc = Tasks.get('usersController');      
      var sel = uc.get('selection');
      var len = sel? sel.length() : 0;
      if (len > 0) {

        // Confirm deletion operation
        SC.AlertPane.warn("_Confirmation".loc(), "_UserDeletionConfirmation".loc(), "_UserDeletionConsequences".loc(), "_Yes".loc(), "_No".loc(), null,
          SC.Object.create({
            alertPaneDidDismiss: function(pane, status) {
              if(status === SC.BUTTON1_STATUS) {
                var context = {};
                for (var i = 0; i < len; i++) {
                  // Get and delete each selected user.
                  var user = sel.nextObject(i, null, context);
                  user.destroy();
                }
                // Select the logged in user.
                Tasks.usersController.selectObject(CoreTasks.get('currentUser'));
              }
            }
          })
        );

      }
    },

    setRoleManager: function() {
      Tasks.usersController.set('role', CoreTasks.USER_ROLE_MANAGER);
    },

    setRoleDeveloper: function() {
      Tasks.usersController.set('role', CoreTasks.USER_ROLE_DEVELOPER);
    },

    setRoleTester: function() {
      Tasks.usersController.set('role', CoreTasks.USER_ROLE_TESTER);
    },

    setRoleGuest: function() {
      Tasks.usersController.set('role', CoreTasks.USER_ROLE_GUEST);
    },

    close: function() {
      this.gotoState('loggedIn.applicationManager.ready');
    },

    exitState: function() {
      Tasks.get('settingsPane').remove();
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
    
  }),

  // State to show statistics
  statistics: Ki.State.design({

    enterState: function() {
      Tasks.statisticsController.showStatistics();  
    },
    
    close: function() {
      this.gotoState('loggedIn.applicationManager.ready');
    },

    exitState: function() {
      Tasks.get('statisticsPane').remove();
    }
    
  }),

  // State to manage text import
  textImport: Ki.State.design({

    enterState: function() {
      Tasks.importDataController.openPanel();  
    },
    
    parseAndLoadData: function() {
      Tasks.importDataController.parseAndLoadData();
    },

    close: function() {
      this.gotoState('loggedIn.applicationManager.ready');
    },

    exitState: function() {
      Tasks.get('importDataPane').remove();
    }
    
  }),

  // State to manage text export
  textExport: Ki.State.design({

    enterState: function() {
      Tasks.exportDataController.exportData('Text');
    },
    
    close: function() {
      this.gotoState('loggedIn.applicationManager.ready');
    },

    exitState: function() {
      Tasks.get('exportDataPane').remove();
    }
    
  })
    
});
