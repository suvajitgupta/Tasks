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
 * @author Sean Eidemiller
 */
CoreTasks.Project = CoreTasks.Record.extend(/** @scope CoreTasks.Project.prototype */ {

  /**
   * The name of the project (ex. "FR1").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: CoreTasks.NEW_PROJECT_NAME }),

  /**
   * The amount of time remaining before project completion, expressed in days.
   *
   * This is used for load-balancing.
   */
  timeLeft: SC.Record.attr(String),

  /**
   * The SC.Query to use when searching for tasks associated with this project. 
   */
  tasksQuery: null,

  /**
   * A read-only computed property that returns the list of tasks associated with this project.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  tasks: function() {
    // FIXME: [SE] kill the hardcoded queries for All/UnallocatedTasks below and make 'tasksQuery' work
    // Create the query if necessary.
    if (!this.tasksQuery) {
      if(this.get('name') === CoreTasks.ALL_TASKS_NAME.loc()) {
        this.tasksQuery = SC.Query.local(CoreTasks.Task);
      }
      else if(this.get('name') === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
        this.tasksQuery = SC.Query.local(CoreTasks.Task, 'projectId = null');
      }
      else {
        this.tasksQuery = SC.Query.local(CoreTasks.Task, 'projectId = %@'.fmt(this.get('id')));
      }
    }

    // Execute the query and return the results.
    return this.get('store').find(this.tasksQuery);

  }.property('id').cacheable(),

  /**
   * A read-only computed property that returns the list of tasks allocated to this project
   * before it was first persisted.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  disassociatedTasks: function() {
    // Create the query if necessary.
    if (!this._disassociatedAllocatedTasksQuery) {
      this._disassociatedAllocatedTasksQuery = SC.Query.local(CoreTasks.Task);
    }
    
    // Narrow the conditions.
    this._disassociatedAllocatedTasksQuery.set('conditions', 'projectId = %@'.fmt(this.get('_id')));
    
    // Execute the query and return the results.
    return this.get('store').find(this._disassociatedAllocatedTasksQuery);

  }.property('_id').cacheable(),

  /**
   * Append unit of time after time left.
   */
  displayTimeLeft: function() {
    return CoreTasks.displayTime(this.get('timeLeft'));
  }.property('timeLeft').cacheable(),
  
  /**
   * The path to the icon associated with a project.
   */
  icon: function() {
    if(this.get('tasks').get('length') > 0) return 'project-icon-has-tasks';
    else return 'project-icon-no-tasks';
  }.property('tasks').cacheable(),

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
      
      if(projectHash.timeLeft) {
        this.propertyWillChange('timeLeft');
        this.writeAttribute('timeLeft', projectHash.timeLeft);
        this.propertyDidChange('timeLeft');
      }
      
    } else {
      return this.get('name');
    }
    
  }.property('name').cacheable(),

  /**
   * Adds a given task to the project.
   */
  addTask: function(task) {
    // This has to be done in a separate run loop so that the dynamic "tasks" query is recomputed
    // *after* the change is made to the store.
    SC.RunLoop.begin();
    task.writeAttribute('projectId', this.get('id'));
    SC.RunLoop.end();
    this.notifyPropertyChange('tasks');
  },

  /**
   * Removes a given task from the project.
   */
  removeTask: function(task) {
    // This has to be done in a separate run loop so that the dynamic "tasks" query is recomputed
    // *after* the change is made to the store.
    SC.RunLoop.begin();
    task.writeAttribute('projectId', null);
    SC.RunLoop.end();
    this.notifyPropertyChange('tasks');
  },

  /**
   * Export a project's attributes.
   *
   * @returns {String) A string with the project's data exported in it.
   */
  exportData: function() {
    var projectName = this.get('name');
    var tasksCount = this.get('tasks').get('length');
    var ret;
    if(projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
      ret = '# ' + "_Has".loc() + tasksCount + "_Unallocated".loc() + "_Tasks".loc();
    }
    else {
      ret = projectName;
      var timeLeft = this.get('timeLeft');
      if(timeLeft) ret += (' {' + CoreTasks.displayTime(timeLeft) + '}');
      ret += ' # ' + "_Has".loc() + tasksCount + "_Tasks".loc();
    }
    return ret + '\n';
  },
  
  /**
   * Destroys the project and orphans any tasks that are in it.
   */
  destroy: function() {
    sc_super();

    var tasks = this.get('tasks');
    if (tasks) {
      tasks.forEach(function(task) {
        task.set('projectId', null);
      });
    }
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
    var projectName = line, projectTimeLeft = null, projectTimeUnit = 'd';
    var projectMatches = line.match(/([^\{]+)\{(\d+\.\d+|\d+)(|d|h)\}/);
    if(projectMatches) {
      projectName = projectMatches[1];
      projectTimeLeft = projectMatches[2];
      if(projectMatches[3]) projectTimeLeft += projectMatches[3];
    }
    return {
      name: projectName.replace(/\s+$/, ''),
      timeLeft: projectTimeLeft,
      tasks: []
    };
  }
  
});
