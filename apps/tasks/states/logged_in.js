/**
 * A state to manage interactions of a logged in user.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals CoreTasks Tasks Ki SCUDS sc_require */

Tasks.LoggedInState = Ki.State.extend({
  
  substatesAreConcurrent: YES,
  
  enterState: function() {
    Tasks.loadData();
    Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
  },
  
  // State to handle globally available actions
  globals: Ki.State.design({
    
    initialSubstate: 'ready',
    
    // State indicating global action readiness
    ready: Ki.State.design(),
    
    close: function() {
      Tasks.statechart.gotoState('loggedIn.globals.ready');
    },
    
    // State to handle user settings & management
    settings: Ki.State.design({

      enterState: function() {
        Tasks.settingsController.openPanel();
      },
      
      exitState: function() {
        Tasks.get('settingsPane').remove();
        if(CoreTasks.get('autoSave')) Tasks.saveData();
      }
      
    }),

    displaySettings: function() {
      Tasks.statechart.gotoState('settings');
    },


    // Actions to toggle autosave & notifications
    toggleAutoSave: function(){
      CoreTasks.set('autoSave', !CoreTasks.get('autoSave'));
    },

    toggleShouldNotify: function(){
      CoreTasks.set('shouldNotify', !CoreTasks.get('shouldNotify'));
    },

    // State to show statistics
    statistics: Ki.State.design({

      enterState: function() {
        Tasks.statisticsController.showStatistics();  
      },
      
      exitState: function() {
        Tasks.get('statisticsPane').remove();
      }
      
    }),

    displayStatistics: function() {
      Tasks.statechart.gotoState('statistics');
    },

    // State to manage text import
    textImport: Ki.State.design({

      enterState: function() {
        Tasks.importDataController.openPanel();  
      },
      
      parseAndLoadData: function() {
        Tasks.importDataController.parseAndLoadData();
      },

      exitState: function() {
        Tasks.get('importDataPane').remove();
      }
      
    }),

    importDataAsText: function() {
      Tasks.statechart.gotoState('textImport');
    },
    
    // State to manage text export
    exportDataAsText: function() {
      Tasks.statechart.gotoState('textExport');
    },

    textExport: Ki.State.design({

      enterState: function() {
        Tasks.exportDataController.exportData('Text');
      },
      
      exitState: function() {
        Tasks.get('exportDataPane').remove();
      }
      
    }),

    exportDataAsHTML: function() {
      Tasks.exportDataController.exportData('HTML');
    },

    displayHelp: function() {
      if(SC.platform.touch) window.location = Tasks.getHelpUrl();
      else window.open(Tasks.getBaseUrl() + '#help', '', 'width=1000,height=750,menubar=no,location=no,toolbar=no,directories=no,status=no');
    },

    logout: function() {
      SC.AlertPane.warn("_Confirmation".loc(), "_LogoutConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON1_STATUS) {
              Tasks.LoggedInState._checkForChangesAndExit();
            }
          }
        })
      );
    }

  })
  
});

Tasks.LoggedInState.mixin(/** @scope Tasks.LoggedInState */ {

  _checkForChangesAndExit: function() {
    if(CoreTasks.get('needsSave')) {
      SC.AlertPane.warn("_Confirmation".loc(), "_SaveConfirmation".loc(), null, "_Yes".loc(), "_No".loc(), null,
        SC.Object.create({
          alertPaneDidDismiss: function(pane, status) {
            if(status === SC.BUTTON1_STATUS) {
              Tasks.LoggedInState._saveChangesAndExit();
            }
            else if(status === SC.BUTTON2_STATUS){
              Tasks.LoggedInState._exitWithoutSavingChanges();
            }
          }
        })
      );
    }
    else {
      Tasks.LoggedInState._exitWithoutSavingChanges();
    }
  },

  _saveChangesAndExit: function() {
    CoreTasks.saveChanges();
    Tasks.LoggedInState._terminate();
  },

  _exitWithoutSavingChanges: function() {
    Tasks.LoggedInState._terminate();
  },

  _terminate: function() {

    // console.log('DEBUG: _terminate()');

    // Close down statechart
    Tasks.statechart.gotoState('terminated');
    Tasks.statechart.destroy();

    // Clear cached localStorage data
    if(CoreTasks.useLocalStorage) {
      // TODO: [SG] add checkbox on logout screen to optionally clear localStorage
      // console.log('DEBUG: clearing cached localStorage data');
      SCUDS.LocalStorageAdapterFactory.nukeAllAdapters();
    }

    // Logout user on Server and restart application
    if(Tasks.get('serverType') === Tasks.GAE_SERVER) {
      var params = {
        successCallback: Tasks.LoggedInState._logoutSuccess.bind(Tasks.LoggedInState),
        failureCallback: Tasks.LoggedInState._logoutFailure.bind(Tasks.LoggedInState)
      };
      params.queryParams = {
        UUID: CoreTasks.getPath('currentUser.id'),
        ATO: CoreTasks.getPath('currentUser.authToken')
      };
      // notify Server so that authentication token can be destroyed for security reasons
      CoreTasks.executeTransientPost('logout', null, params);
    }
    else {
      Tasks.LoggedInState._restart();
    }
  },

  _logoutSuccess: function(response) {
    // console.log('DEBUG: Logout succeeded on Server');
    Tasks.LoggedInState._restart();
  },

  _logoutFailure: function(response) {
    console.error('Logout failed on Server');
    Tasks.LoggedInState._restart();
  },

  _restart: function() {
    window.location = Tasks.getBaseUrl();
  }

});
