/**
 * A state to manage interactions of a logged in user.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki sc_require */

Tasks.LoggedInState = Ki.State.extend({
  
  substatesAreConcurrent: YES,
  
  enterState: function() {
    Tasks.loadData();
    Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
  },
  
  // State to handle globally available actions
  globals: Ki.State.design({
    
    initialSubstate: 'ready',
    
    close: function() {
      Tasks.statechart.gotoState('loggedIn.globals.ready');
    },

    // State indicating global action readiness
    ready: Ki.State.design(),
    
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
      Tasks.logout();
    }

  })

});