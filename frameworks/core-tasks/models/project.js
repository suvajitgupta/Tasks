/*globals CoreTasks sc_require */

sc_require('models/record');

CoreTasks.NEW_PROJECT_NAME = '_NewProject';
CoreTasks.INBOX_NAME = '_Inbox';
CoreTasks.ALL_TASKS_NAME = '_AllTasks';

/**
 * The project model.
 *
 * A project is a container for tasks
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
 */
CoreTasks.Project = CoreTasks.Record.extend(/** @scope CoreTasks.Project.prototype */ {

  /*
  init: function() {
    sc_super();
    this.set('tasks', []);
  },
  */

  /**
   * The name of the project (ex. "FR1").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: CoreTasks.NEW_PROJECT_NAME }),

  /**
   * The amount of time remaining before project completion, expressed in days.
   *
   * This is used for load-balancing.
   */
  timeLeft: SC.Record.attr(Number),

  /**
   * The list of tasks associated with this project.
   */
  tasks: SC.Record.toMany('CoreTasks.Task', { defaultValue: [] }),

  /**
   * The path to the icon associated with a project.
   */
  icon: function() {
    if(this.get('tasks').get('length') > 0) return 'project-icon-with-tasks';
    else return 'project-icon-no-tasks';
  }.property().cacheable(),

  /**
   * A string summarizing key facets of the Project for display.
   */
  displayName: function(key, value) {
    if (value !== undefined) {
      
      var currentName = this.get('name');
      var projectHash = CoreTasks.Project.parse(value);
      // console.log("PARSED PROJECT: " + JSON.stringify(projectHash));
      
      if(currentName !== projectHash.name && CoreTasks.getProject(projectHash.name)) {
        console.log('Project Editing Error - a project with this name already exists: ' + projectHash.name);
        return;
      }
      
      this.propertyWillChange('name');
      this.writeAttribute('name', projectHash.name);
      this.propertyDidChange('name');
      
      this.propertyWillChange('timeLeft');
      this.writeAttribute('timeLeft', projectHash.timeLeft);
      this.propertyDidChange('timeLeft');
      
    } else {
      var name = this.get('name');
      var timeLeft = this.get('timeLeft');
      var ret = name;
      if (timeLeft) ret += ' {' + timeLeft + '}';
      return ret;
    }
    
  }.property('name', 'timeLeft').cacheable(),

  /**
   * Adds a given task to the project.
   */
  addTask: function(task) {
    var tasks = this.get('tasks'); 
    tasks.pushObject(task);

    // Not quite sure why this has to be executed in a new run loop, but it does (saw this in a
    // unit test; didn't work before).
    SC.RunLoop.begin();
    this.set('tasks', tasks);
    SC.RunLoop.end();

    return tasks;
  },

  /**
   * Removes a given task from the project.
   */
  removeTask: function(task) {
    var tasks = this.get('tasks'); 
    tasks.removeObject(task);

    // Not quite sure why this has to be executed in a new run loop, but it does (saw this in a
    // unit test; didn't work before).
    SC.RunLoop.begin();
    this.set('tasks', tasks);
    SC.RunLoop.end();

    return tasks;
  }
  
});

CoreTasks.Project.mixin(/** @scope CoreTasks.Project */ {
  
  callbacks: SC.Object.create(),
  resourcePath: 'project',
  
  /**
   * Parse a line of text and extract parameters from it.
   *
   * @param {String} string to extract parameters from.
   * @returns {Object} Hash of parsed parameters.
   */
  parse: function(line) {
    var projectName = line, projectTimeLeft = null;
    var res = line.match(/([\w\s]+)\{(\d+\.\d+|\d+)\}/);
    if(res) {
      projectName = res[1];
      projectTimeLeft = res[2];
    }
    return {
      name: projectName.replace(/\s+$/, ''),
      timeLeft: projectTimeLeft,
      tasks: []
    };
  }
  
});
