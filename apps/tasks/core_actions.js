/**
 * A mixin that defines all of the "actions" that trigger state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 */
/*globals Tasks sc_require */
sc_require('core');

Tasks.mixin({
  
  // TODO: Should we be using parameters in any of these action functions?
  login: function(loginName, password) {
    switch (this.state.a) {
      case 1:
        this.goState('a', 2);
        if (this._authenticateUser (loginName, password)) {
          this.authenticationSuccess();
        } 
        else {
          this.authenticationFailure();
        }
        break;
      default:
        this._logActionNotHandled('login', 'a', this.state.a);  
    }
  },
  
  _authenticateUser: function(loginName, password) { // TODO: implement server-based authentication
    var store = Tasks.get('store');
    var users = Tasks.store.findAll(Tasks.User);
    var len = users.get('length');
    for (var i = 0; i < len; i++) {
      if (loginName === users.objectAt(i).get('loginName')) {
        return true;
      }
    }
    return false;
  },
  
  authenticationSuccess: function() {
    switch (this.state.a) {
      case 2:
        this.goState('a', 3);
        this._loadData();

        // TODO: Use callbacks for this instead.
        this.dataLoadSuccess();
        break;
      default:
        this._logActionNotHandled('authenticationSuccess', 'a', this.state.a);  
    }
  },

  _loadData: function() {
    // Load all of the tasks from the data source (via the store)
    var projects = Tasks.get('store').findAll(Tasks.Project);
    
    // Prepend and populate the special "Inbox" project that will contain all unassigned tasks.
    projects.insertAt(0, this._createInbox());

    // TODO: Implement callbacks in the data source.
    /*
    , {
      successCallback: Tasks.dataLoadSuccess().bind(this),
      failureCallback: Tasks.dataLoadFailure().bind(this)
    });
    */

    Tasks.projectsController.set('content', projects);
  },

  _createInbox: function() {
    var store = Tasks.get('store');

    // Extract all unassigned tasks for the Inbox
    var tasks = store.findAll(Tasks.Task), task, unassigned = [];
    var taskCount = tasks.get('length');
    for (var i = 0; i < taskCount; i++) {
      task = tasks.objectAt(i);
      unassigned.push(task.get('id')); // add in all tasks
    }
    
    var projects = store.findAll(Tasks.Project), project;
    var projectCount = projects.get('length');
    for (i = 0; i < projectCount; i++) {
      project = projects.objectAt(i);
      tasks = project.get('tasks');
      taskCount = tasks.get('length');
      for (var j = 0; j < taskCount; j++) {
        task = tasks.objectAt(j);
        var idx = unassigned.indexOf(task.get('id'));
        unassigned.splice(idx, 1); // remove assigned tasks
      }
    }

    // FIXME: This doesn't actually appear to get persisted in the fixtures data source.
    var inbox = store.createRecord(Tasks.Project, { id: 0, name: Tasks.INBOX_PROJECT_NAME, tasks: unassigned });
    Tasks.set('inbox', inbox);
    return inbox;
  },
  
  authenticationFailure: function() {
    switch (this.state.a) {
      case 2:
        alert('Authentication failed');
        this.goState('a', 1);
        break;
      default:
        this._logActionNotHandled('authenticationFailure', 'a', this.state.a);  
    }
  },
  
  dataLoadSuccess: function() {
    switch (this.state.a) {
      case 3:
        this.goState('a', 4);
        break;
      default:
        this._logActionNotHandled('dataLoadSuccess', 'a', this.state.a);  
    }
  },
  
  dataLoadFailure: function() {
    switch (this.state.a) {
      case 3:
        // TODO: implement state transition & actions
        break;
      default:
        this._logActionNotHandled('dataLoadSuccess', 'a', this.state.a);  
    }
  },
  
  /**
   * Logs a message indicating that the given state isn't handled in the given action.
   *
   * @param {String} action The name of the action (ex. "logout").
   * @param {String} stateName The name of the state (ex. "a").
   * @param {Integer} stateNum The number of the sate (ex. "4").
   */
  _logActionNotHandled: function(action, stateName, stateNum) {
    console.log('Action not handled in state %@[%@]: %@'.fmt(stateName, stateNum, action));
  }

});

// ============================================================================
// Tasks -- A simplified task manager built with the SproutCore framework
// Copyright (C) 2009 Suvajit Gupta
//
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option)
// any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along
// with this program.  If not, see <http://www.gnu.org/licenses/>.
// ============================================================================
