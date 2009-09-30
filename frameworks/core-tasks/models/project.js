/*globals CoreTasks sc_require */

sc_require('models/record');

CoreTasks.NEW_PROJECT_NAME = '_NewProject';
CoreTasks.ALL_TASKS_NAME = '_AllTasks';
CoreTasks.UNALLOCATED_TASKS_NAME = '_UnallocatedTasks';

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
    if(this.get('tasks').get('length') > 0) return 'project-icon-has-tasks';
    else return 'project-icon-no-tasks';
  }.property().cacheable(),

  /**
   * A string summarizing key facets of the Project for display.
   */
  displayName: function(key, value) {
    // TODO: [SG] don't allow editing of Unallocated/AllTasks project names
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
      
      if(projectHash.timeLeft) {
        this.propertyWillChange('timeLeft');
        this.writeAttribute('timeLeft', projectHash.timeLeft);
        this.propertyDidChange('timeLeft');
      }
      
    } else {
      return this.get('name');
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
  },

  /**
  * Export a project's attributes.
  * @returns {String) return a string with the project's data exported in it.
  */
  exportData: function() {
    var projectName = this.get('name');
    if(projectName === CoreTasks.ALL_TASKS_NAME || projectName === CoreTasks.UNALLOCATED_TASKS_NAME) return '';
    var ret = projectName;
    var timeLeft = this.get('timeLeft');
    if(timeLeft) ret += (' {' + timeLeft + '}');
    return ret + '\n';
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
    var res = line.match(/([^\{]+)\{(\d+\.\d+|\d+)\}/);
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
