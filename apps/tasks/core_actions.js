/**
 * A mixin that defines all of the "actions" that trigger state transitions.
 *
 * @author Sean Eidemiller
 * @author Suvajit Gupta
 */
/*globals Tasks sc_require */
sc_require('core');

Tasks.mixin({
  
  // TODO: [SG] Should we be using parameters in any action functions?
  authenticate: function(loginName, password) {
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
  
  _authenticateUser: function(loginName, password) { // TODO: [SG] implement server-based authentication
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
        // TODO: [SE] install succsss/failure callbacks for this instead.
        this.dataLoadSuccess();
        break;
      default:
        this._logActionNotHandled('authenticationSuccess', 'a', this.state.a);  
    }
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
  
  _loadData: function() {
    // Load all of the tasks from the data source (via the store)
    var projects = Tasks.get('store').findAll(Tasks.Project);
    
    // Prepend and populate the special "Inbox" project that will contain all unassigned tasks.
    projects.insertAt(0, this._createInbox());
    var moreProjects = Tasks.get('store').findAll(Tasks.Project);
 
    // TODO: [SE] Implement succsss/failure callbacks in the data source.
    /*
    , {
      successCallback: Tasks.dataLoadSuccess().bind(this),
      failureCallback: Tasks.dataLoadFailure().bind(this)
    });
    */

    Tasks.get('projectsController').set('content', projects);
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

    // FIXME: [SE] investigate why projects added to the store don't show up in findAll()
    var inbox = store.createRecord(Tasks.Project, { id: 0, name: Tasks.INBOX_PROJECT_NAME, tasks: unassigned });
    Tasks.set('inbox', inbox);
    return inbox;
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
        // TODO: [SG] implement data load failure state transition & actions
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
  },
  
  addProject: function() {
    
    var pc = Tasks.get('projectsController');
    // Create a new project with a default name
    // TODO: [SG] add new project right after selected item    

    var store = Tasks.get('store');
    var task = store.createRecord(Tasks.Project, { name: Tasks.NEW_PROJECT_NAME });
    store.commitRecords();
    pc.addObject(task); // TODO: [SC] Why do we have to manually add to the controller instead of store notifying?

    var listView = Tasks.getPath('mainPage.mainPane.middleView.topLeftView.contentView');
    var idx = listView.length - 1; // get index of new project in list
    // TODO: [SG] get index of new project wherever it is in the list, don't assume it is at the end
    listView.select(idx);

    // Begin editing newly created item.
    var itemView = listView.itemViewForContentIndex(idx);
    itemView.beginEditing.invokeLater(itemView);  // you must wait for run loop to complete before method is called
    // TODO: [SC] when user changes name of New Project it doesn't change in ListView
  },
  
  deleteProject: function() {
    
    var pc = Tasks.get('projectsController');
    //get the selected tasks
    var sel = pc.get('selection');
    
    if (sel && sel.length() > 0) {
      var store = Tasks.get('store');

      //pass the record to be deleted
      var keys = sel.firstObject().get('id');
      store.destroyRecords(Tasks.Project, [keys]);

      //commit the operation to send the request to the server
      store.commitRecords();
      // TODO: [SC] what to do to remove the "New Project" from the ListView and clear the selection?
    }
  },
  
  importData: function() {
    // TODO: [SG] implement view to prompt user for data to import (sample data hardcoded below for testing)
    var data = 
    '#A comment\n     \n' +
    'Existing Project\n' +
    '^ My first task {2} @Done\n' +
    '| description line1\n' +
    '| description line2\n' +
    '- My second task $Bug [SG] <EO> @Risky #Failed\n' +
    'v My third task {12-14}\n' +
    ' \t \n' +
    'New Project {12}\n';
    this._parseAndLoadData(data);
  },
  
  _parseAndLoadData: function(data) { // TODO: [SE] create objects in store during data import
    var lines = data.split('\n');
    var store = Tasks.get('store');
    var taskPattern = new RegExp('(.+)\\s*[\\{<\\[\\$@%].+');
    var taskEffortPattern = new RegExp('\{(\\d+)\}|\{(\\d+-\\d+)\}');
    
    var currentProject = Tasks.get('inbox');
    for (var i = 0; i < lines.length; i++) {
      
      var line = lines[i];
      // console.log("Parsing line '" + line + "'\n");
      
      if (line.indexOf('#') === 0) { // a Comment
        var commentLine = line.slice(1);
        console.log ('Commment:\t' + commentLine);
      }
      else if (line.match(/^[\^\-v][ ]/)) { // a Task
        // extract priority based on bullet
        var priority = Tasks.TASK_PRIORITY_MEDIUM;
        if (line.charAt(0) === '^') {
          priority = Tasks.TASK_PRIORITY_HIGH;
        } else if (line.charAt(0) === 'v') {
          priority = Tasks.TASK_PRIORITY_LOW;
        }
        var taskLine = line.slice(2); // TODO: [SG] extract other task fields if provided
        var taskMatches = taskPattern.exec(taskLine);
        if (taskMatches) {
          taskLine = taskMatches[1];
        }
        var output = 'Task:\t\t' + taskLine + ' of Priority: ' + priority;
        var taskEffortMatches = taskEffortPattern.exec(taskLine);
        if(taskEffortMatches) {
          var taskEffort = taskEffortMatches[1]? taskEffortMatches[1] : taskEffortMatches[2];
          output += ' of Effort: ' + taskEffort;
        }
        console.log (output);
        var taskRecord = store.createRecord(Tasks.Task, { name: taskLine, priority: priority });
        console.log('DEBUG: ' + taskRecord);
        if(!taskRecord) {
          console.log('ERROR: task creation failed!');
          continue;
        }
        currentProject.get('tasks').pushObject(taskRecord);
      }
      else if (line.indexOf('| ') === 0) { // a Description
        var descriptionLine = line.slice(2);
        console.log ('Description:\t' + descriptionLine);
      }
      else if (line.search(/^\s*$/) === 0) { // a blank line
        console.log ('Blank Line:');
      }
      else { // a Project
        // extract timeLeft if provided
        var projectName = line, timeLeft = null;
        var res = line.match(/([\w\s]*)[\s*]\{(\d+)\}/);
        if(res) {
          projectName = res[1];
          timeLeft = res[2];
        }
        console.log ('Project:\t\t' + projectName);
        if (timeLeft) {
          console.log (' with TimeLeft: ' + timeLeft);
        }
      }
     }
  },
  
  exportData: function() {

    var val, task, user, data = "# Tasks data export at " + new Date().format('MMM dd, yyyy hh:mm:ssa') + '\n\n';
    
    var pc = Tasks.get('projectsController');
    pc.forEach(function(rec){
          var tasks = rec.get('tasks');
          var len = tasks.get('length');
          if(rec.get('name') !== Tasks.INBOX_PROJECT_NAME) {
            data += rec.get('displayName') + '\n';
          }
          for (var i = 0; i < len; i++) {
            task = tasks.objectAt(i);
            switch(task.get('priority')) {
              case Tasks.TASK_PRIORITY_HIGH: val = '^'; break;
              case Tasks.TASK_PRIORITY_MEDIUM: val = '-'; break;
              case Tasks.TASK_PRIORITY_LOW: val = 'v'; break;
            }
            data += val + ' ';
            data += task.get('displayName');
            user = task.get('submitter');
            if (user) data += ' <' + user.get('name') + '>';
            user = task.get('assignee');
            if (user) data += ' [' + user.get('name') + ']';
            val = task.get('type');
            if(val !== Tasks.TASK_TYPE_OTHER)  data += ' $' + val;
            val = task.get('status');
            if(val !== Tasks.TASK_STATUS_PLANNED)  data += ' @' + val;
            val = task.get('validation');
            if(val !== Tasks.TASK_VALIDATION_UNTESTED)  data += ' %' + val;
            val = task.get('description');
            if(val) {
              var lines = val.split('\n');
              for (var j = 0; j < lines.length; j++) {
                data += '\n| ' + lines[j];
              }
            }
            data += '\n';
          }
          data += '\n';
      }, pc);
    
    console.log(data);
  },
  
  saveData: function() { // TODO: [SG] implement project data saving
    this._notImplemented ('saveData');
  },
  
  addTask: function() { // TODO: [SG] implement task addition
    this._notImplemented ('addTask');
  },
  
  deleteTask: function() { // TODO: [SG] implement task deletion
    this._notImplemented ('deleteTask');
  },
  
  _notImplemented: function(functionName) {
    var prefix = '';
    if(functionName) {
      prefix = functionName + '(): ';
    }
    alert (prefix + 'Not yet implemented');
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
