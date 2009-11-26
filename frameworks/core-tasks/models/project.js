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
   * Append unit of time after time left.
   */
  displayTimeLeft: function() {
    return CoreTasks.displayTime(this.get('timeLeft'));
  }.property('timeLeft').cacheable(),
  
  /**
   *  This computed property buffers changes to the timeLeft field.
   */
  timeLeftValue: function(key, value){
    if (value !== undefined) {
      if(value === '') {
        this.propertyWillChange('timeLeft');
        this.writeAttribute('timeLeft', null);
        this.propertyDidChange('timeLeft');
      }
      else {
        var timeLeft = CoreTasks.Project.parseTimeLeft('{' + value + '}');
        if(timeLeft) {
          this.propertyWillChange('timeLeft');
          this.writeAttribute('timeLeft', timeLeft);
          this.propertyDidChange('timeLeft');
          value = timeLeft;
        }
      }
    }
    else {
      value = this.get('timeLeft');
    }
    return value;
  }.property('timeLeft').cacheable(),

  // TODO: [SG] add 'isReserved()' method and use this from View layer

  /**
   * A read-only computed property that returns the list of tasks associated with this project.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  tasks: function() {
    var query, recArray ;
    
    if (this.get('name') === CoreTasks.ALL_TASKS_NAME.loc()) {
      query = SC.Query.local(CoreTasks.Task);
    }
    else if (this.get('name') === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
      query = SC.Query.local(CoreTasks.Task, 'projectId=null');
    }
    else {
      query = SC.Query.local(CoreTasks.Task, "projectId='%@'".fmt(this.get('id')));
    }
    
    query.set('initialServerFetch', NO);
    
    // Execute the query and return the results.
    recArray = this.get('store').find(query) ;
    
    // observe the length property of the recAry for changes
    recArray.addObserver('length', this, this._tasksLengthDidChange) ;
    
    return recArray ;
  }.property('id', 'name').cacheable(),
  
  _tasksLengthDidChange: function() {
    // console.log('%@._tasksLengthDidChange()'.fmt(this));
    this.propertyDidChange('*') ; // refresh ourself
  },
  
  /**
   * A read-only computed property that returns the list of tasks allocated to this project
   * before it was first persisted.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  disassociatedTasks: function() {
    // Create the query if necessary.
    if (!this._disassociatedAllocatedTasksQuery) {
      this._disassociatedAllocatedTasksQuery = SC.Query.local(CoreTasks.Task,
        "projectId='%@'".fmt(this.get('_id')));
    }

    // Execute the query and return the results.
    return this.get('store').find(this._disassociatedAllocatedTasksQuery);

  }.property('_id').cacheable(),

  /**
   * The path to the icon associated with a project.
   */
  icon: function() {
    if(this.getPath('tasks.length') > 0) return 'project-icon-has-tasks';
    else return 'project-icon-no-tasks';
  }.property('tasks'),

  /**
   * A string summarizing key facets of the Project for display.
   */
  displayName: function(key, value) {
    if (value !== undefined) {
      
      var currentName = this.get('name');
      var projectHash = CoreTasks.Project.parse(value);
      
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
   * Export a project's attributes.
   *
   * @returns {String) A string with the project's data exported in it.
   */
  exportData: function() {
    
    var projectName = this.get('name');
    var tasksCount = this.get('tasks').get('length');
    var ret;
    if(projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
      ret = '# ' + "_Has".loc() + tasksCount + ' ' + "_Unallocated".loc() + "_Tasks".loc();
    }
    else {
      ret = projectName;
      var timeLeft = this.get('timeLeft');
      if(timeLeft) ret += (' {' + CoreTasks.displayTime(timeLeft) + '}');
      ret += ' # ' + "_Has".loc() + tasksCount + "_Tasks".loc();
    }
    
    var val = this.get('description');
    if(val) {
      var lines = val.split('\n');
      for (var j = 0; j < lines.length; j++) {
        ret += '\n| ' + lines[j];
      }
    }
    
    ret += '\n';
    return ret;
    
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
      this.get('tasks').destroy();
      this._tasksQuery = null;
    }
  }

});

CoreTasks.Project.mixin(/** @scope CoreTasks.Project */ {
  
  callbacks: SC.Object.create(),
  resourcePath: 'project',

  /**
   * Parse a string and extract timeLeft from it.
   *
   * @param {String} string to extract timeLeft from.
   * @returns {String} project time left.
   */
  parseTimeLeft: function(line) {
    var projectTimeLeft = null;
    var projectTimeLeftMatches = /\{(\d+\.\d+|\d+)(|d|h)\}/.exec(line);
    if(projectTimeLeftMatches) {
      projectTimeLeft = projectTimeLeftMatches[1];
      if(projectTimeLeftMatches[2]) projectTimeLeft += projectTimeLeftMatches[2]; // append provided time unit
    }
    return projectTimeLeft;
  },

  /**
   * Parse a line of text and extract parameters from it.
   *
   * @param {String} string to extract parameters from.
   * @returns {Object} Hash of parsed parameters.
   */
  parse: function(line) {
    
    var projectName = line;
    var projectNameMatches = line.match(/([^\{\#]+)/);
    if(projectNameMatches) {
      projectName = projectNameMatches[1].replace(/\s+$/, ''); // trim trailing whitespace, if any
    }
    var projectTimeLeft = CoreTasks.Project.parseTimeLeft(line);
    
    var ret = {
      name: projectName,
      timeLeft: projectTimeLeft,
      tasks: []
    };
    // console.log("DEBUG: Project hash = " + JSON.stringify(ret));
    return ret;
    
  }
  
});
