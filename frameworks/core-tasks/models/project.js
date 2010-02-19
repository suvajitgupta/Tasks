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

  // FIXME [SC]: need to fix SC.Query to handle negative numbers - recently broken since commit e3bbb4a88ae2bc9fa217d0cf5a24868683f6ae91
  // FIXME [SC]: fix all Tasks being fetched after a Project name is changed - should only update Project record
  /**
   * A read-only computed property that returns the list of tasks associated with this project.
   *
   * @returns {SC.RecordArray} An array of tasks.
   */
  tasks: function() {
    
    var id = this.get('id');
    if(SC.none(this._oldId) || (this._oldId !== id)) {
      this._oldId = id;
    
      // console.log('DEBUG: computing tasks() for project: ' + this.get('displayName'));
      var query, recArray ;
    
      if (this === CoreTasks.get('allTasksProject')) {
        query = SC.Query.local(CoreTasks.Task);
      }
      else if (this === CoreTasks.get('unallocatedTasksProject')) {
        query = SC.Query.local(CoreTasks.Task, 'projectId=null');
      }
      else {
        query = SC.Query.local(CoreTasks.Task, "projectId=%@".fmt(this.get('id')));
      }
    
      query.set('initialServerFetch', NO);
    
      // Execute the query and return the results.
      this._recArray = this.get('store').find(query) ;
    
      // observe the length property of the recAry for changes
      this._recArray.addObserver('length', this, this._tasksLengthDidChange);
      
    }
    
    return this._recArray;
    
  }.property('id').cacheable(),
  
  _tasksLengthDidChange: function() {
    // console.log('DEBUG: tasks length changed for project: ' + this.get('name'));
    var len = this.getPath('tasks.length');
    if(SC.none(this._oldLength) || (this._oldLength !== len)) {
      this._oldLength = len;
      // console.log('DEBUG: tasks length changed for project: ' + this.get('name'));
      this.propertyDidChange('*') ; // refresh ourself
    }
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
        "projectId=%@".fmt(this.get('_id')));
    }

    // Execute the query and return the results.
    return this.get('store').find(this._disassociatedAllocatedTasksQuery);

  }.property('_id').cacheable(),

  /**
   * The path to the icon associated with a project.
   */
  icon: function() {
    if(CoreTasks.isSystemProject(this)) return 'system-project-icon';
    return this.get('description')? 'project-icon-has-description' : 'project-icon-no-description';
  }.property('description'),

  /**
   * A string summarizing key facets of the Project for display.
   */
  displayName: function(key, value) {
    
    if (value !== undefined) {
      
      var currentName = this.get('name');
      if (currentName === CoreTasks.ALL_TASKS_NAME.loc() || currentName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return;
      
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
   * @param {String} format in which data is to be exported.
   * @returns {String) A string with the project's data exported in it.
   */
  exportData: function(format) {
    
    var projectName = this.get('name');
    var tasksCount = this.get('tasks').get('length');
    
    var ret = '';
    if(format === 'HTML') ret += '<h1>';
    
    if(projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) {
      if(format === 'Text') ret += '# ';
      ret += "_Unallocated".loc();
    }
    else {
      ret += projectName;
      var timeLeft = this.get('timeLeft');
      if(timeLeft) {
        if(format === 'HTML') ret += '&nbsp;<span class="time">';
        else ret += ' {';
        ret += CoreTasks.displayTime(timeLeft);
        if(format === 'HTML') ret += '</span>';
        else ret += '}';
      }
    }
    
    if(format === 'HTML') ret += '&nbsp;<span class="total">';
    else ret += ' # ';
    ret += "_Has".loc() + tasksCount + "_tasks".loc();
    if(format === 'HTML') ret += '</span></h1>';
    
    var val = this.get('description');
    if(val) {
      if(format === 'HTML') ret += '\n<pre>';
      var lines = val.split('\n');
      for (var j = 0; j < lines.length; j++) {
        ret += '\n';
        if(format === 'Text') ret += '| ';
        ret += lines[j];
      }
      if(format === 'HTML') ret += '\n</pre>';
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
    
    var matches = line.match(/\{/g);
    if(matches === null || matches.length === 1) {
      var projectTimeLeftMatches = /\{(\d+\.\d+|\d+)(|d|h)\}/.exec(line);
      if(projectTimeLeftMatches) {
        projectTimeLeft = projectTimeLeftMatches[1];
        if(projectTimeLeftMatches[2]) projectTimeLeft += projectTimeLeftMatches[2]; // append provided time unit
      }
    }
    else {
      console.warn('Project Parsing Error - multiple timeLefts illegal');
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
    var projectNameMatches = line.match(/^([^\{\#]+)/);
    if(projectNameMatches) {
      projectName = projectNameMatches[1].replace(/^\s+/, '').replace(/\s+$/, ''); // trim leading/trailing whitespace, if any
    }
    var projectTimeLeft = CoreTasks.Project.parseTimeLeft(line);
    
    var ret = {
      name: projectName,
      timeLeft: projectTimeLeft,
      tasks: []
    };
    // console.log('DEBUG: Project hash = ' + JSON.stringify(ret));
    return ret;
    
  }
  
});

CoreTasks.Project.NEW_PROJECT_HASH = {
  name: CoreTasks.NEW_PROJECT_NAME
};