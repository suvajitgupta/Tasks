/*globals CoreTasks sc_require */

sc_require('models/record');

CoreTasks.NEW_PROJECT_NAME = '_NewProject';
CoreTasks.ALL_TASKS_NAME = '_AllTasks';
CoreTasks.UNALLOCATED_TASKS_NAME = '_UnallocatedTasks';
CoreTasks.UNASSIGNED_TASKS_NAME = '_UnassignedTasks';

CoreTasks.DATE_FORMAT = '%m/%d/%Y';

CoreTasks.projectStatusesAllowed = [
  CoreTasks.STATUS_PLANNED,
  CoreTasks.STATUS_ACTIVE,
  CoreTasks.STATUS_DONE
];

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
   * A string summarizing key facets of the Project for display.
   */
  displayName: function(key, value) {
    
    if (value !== undefined) {
      
      var currentName = this.get('name');
      if (currentName === CoreTasks.ALL_TASKS_NAME.loc() || currentName === CoreTasks.UNALLOCATED_TASKS_NAME.loc()) return;
      
      var projectHash = CoreTasks.Project.parse(value, false);
      
      this.propertyWillChange('name');
      this.writeAttribute('name', projectHash.name);
      this.propertyDidChange('name');
      
      if(projectHash.timeLeft) {
        this.propertyWillChange('timeLeft');
        this.writeAttribute('timeLeft', projectHash.timeLeft);
        this.propertyDidChange('timeLeft');
      }
      
      if(projectHash.developmentStatus) {
        this.propertyWillChange('developmentStatus');
        this.writeAttribute('developmentStatus', projectHash.developmentStatus);
        this.propertyDidChange('developmentStatus');
      }
      
      if(projectHash.activatedAt) {
        this.set('activatedAt', SC.DateTime.parse(projectHash.activatedAt, CoreTasks.DATE_FORMAT));
      }
      
    } else {
      return this.get('name');
    }
    
  }.property('name').cacheable(),

  /**
   * The amount of time remaining before project completion, expressed in days.
   *
   * This is used for load-balancing.
   */
  timeLeft: SC.Record.attr(String),

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

  /**
   * The development status of the project (see below for allowed values).
   */
  developmentStatus: SC.Record.attr(String, {
    isRequired: YES,
    defaultValue: CoreTasks.STATUS_PLANNED,
    allowed: CoreTasks.projectStatusesAllowed
   }),

   /**
    *  This computed property buffers changes to the developmentStatus field.
    */
   developmentStatusValue: function(key, value) {

     if (value !== undefined) {
       this.set('developmentStatus', value);
     } else {
       value = this.get('developmentStatus');
       if (value === null) value = CoreTasks.STATUS_PLANNED;
     }

     return value;

   }.property('developmentStatus').cacheable(),

   /**
    * The time when the project is activated. Null for inactive projects.
    *
    * This is used for load-balancing.
    */
   activatedAt: SC.Record.attr('CoreTasks.Date'),

   /**
    *  This computed property buffers changes to the activatedAt field.
    */
   activatedAtValue: function(key, value) {
     
     if (value !== undefined) {
       this.set('activatedAt', value);
     } else {
       value = this.get('activatedAt');
       if (SC.typeOf(value) === SC.T_NUMBER) value = SC.DateTime.create(value);
     }

     return value;
     
   }.property('activatedAt').cacheable(),

   /**
    * The number of days left in the project counting down from current time.
    */
   // TODO: [SG] switch to start/endDate instead of activatedAt/timeLeft
   countDown: function() {
     
     var timeLeft = this.get('timeLeft');
     if (SC.none(timeLeft)) return null;
     timeLeft = CoreTasks.convertTimeToDays(timeLeft);
     
     var activatedAt = this.get('activatedAtValue');
     // console.log('DEBUG: name: "' + this.get('name')  + '", timeLeft: ' + timeLeft + 'd, activatedAt: ' + (activatedAt? activatedAt.toFormattedString(CoreTasks.DATE_FORMAT) : 'null'));
     if (SC.none(activatedAt)) return timeLeft;
     
     // var today = SC.DateTime.parse(CoreTasks.Project.parseActivatedAt("<07/19/2010>"), CoreTasks.DATE_FORMAT); // testing code
     var today = SC.DateTime.create();
     var todayOfYear = today.get('dayOfYear');
     var todayOfWeek = today.get('dayOfWeek');
     // console.log('DEBUG: today: ' + today.toFormattedString(CoreTasks.DATE_FORMAT) + ', todayOfYear: ' + todayOfYear);
     if(todayOfWeek < 2) { // if Sunday or Monday go back to last Saturday
       todayOfYear -= (todayOfWeek === 0? 1 : 2);
       todayOfWeek = 6;
       // console.log('DEBUG: revised todayOfYear: ' + todayOfYear + ', todayOfWeek: ' + todayOfWeek);
     }
     
     var activationDayOfYear = activatedAt.get('dayOfYear');
     var activationDayOfWeek = activatedAt.get('dayOfWeek');
     // console.log('DEBUG: activationDayOfYear: ' + activationDayOfYear + ', activationDayOfWeek: ' + activationDayOfWeek);
     if(activationDayOfWeek === 0 || activationDayOfWeek === 6) { // if weekend day go to next Monday
       activationDayOfYear += (activationDayOfWeek === 0? 1 : 2);
       activationDayOfWeek = 1;
       // console.log('DEBUG: revised activationDayOfYear: ' + activationDayOfYear + ', activationDayOfWeek: ' + activationDayOfWeek);
     }
     
     var daysElapsed = todayOfYear - activationDayOfYear;
     if(daysElapsed < 0) daysElapsed = 0;
     var weeksElapsed = Math.floor(daysElapsed/7);
     var weekendDays = weeksElapsed*2;
     if(activationDayOfWeek > todayOfWeek) weekendDays += 2; // another weekend is in the mix
     // console.log('DEBUG: daysElapsed: ' + daysElapsed + ', weeksElapsed: ' + weeksElapsed + ', weekendDays: ' + weekendDays);
     if(daysElapsed > 2 && weekendDays > 0) {
       daysElapsed -= weekendDays;
       // console.log('DEBUG: revised daysElapsed: ' + daysElapsed);
     }
     
     var countDown = timeLeft - daysElapsed;
     // console.log('DEBUG: countDown: ' + countDown);
     if (countDown < 0) countDown = 0;
     
     return countDown;
     
   }.property('timeLeft', 'activatedAt').cacheable(),

   /**
    * Append unit of time after countDown.
    */
   displayCountDown: function() {
     var countDown = this.get('countDown');
     return SC.none(countDown)? null : (countDown + 'd');
   }.property('countDown').cacheable(),


  // FIXME: [SC] fix SC.Query firing unnecessarily when you update a Project name, all Tasks are fetched
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
      else if (this === CoreTasks.get('unassignedTasksProject')) {
        query = SC.Query.local(CoreTasks.Task, 'assigneeId=null');
      }
      else {
        query = SC.Query.local(CoreTasks.Task, "projectId=%@".fmt(this.get('id')));
      }
    
      // Execute the query and return the results.
      query.set('initialServerFetch', NO);
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
    if(SC.none(this.get('_id'))) return null;

    // Create the query if necessary.
    if (!this._disassociatedAllocatedTasksQuery) {
      this._disassociatedAllocatedTasksQuery = SC.Query.local(CoreTasks.Task,
        "projectId=%@".fmt(this.get('_id')));
      this._disassociatedAllocatedTasksQuery.set('initialServerFetch', NO);
    }

    // Execute the query and return the results.
    return this.get('store').find(this._disassociatedAllocatedTasksQuery);

  }.property('_id').cacheable(),

  /**
   * The path to the icon associated with a project.
   */
  icon: function() {
    var hasTasks = this.getPath('tasks.length') > 0;
    if(CoreTasks.isSystemProject(this)) return hasTasks? 'system-project-icon' : 'empty-system-project-icon';
    return hasTasks? 'project-icon' : 'empty-project-icon';
  }.property('tasks'),

  /**
   * Export a project's attributes.
   *
   * @param {String} format in which data is to be exported.
   * @returns {String) A string with the project's data exported in it.
   */
  exportData: function(format) {
    
    var projectName = this.get('name');
    var developmentStatus = this.get('developmentStatus');
    var tasksCount = this.get('tasks').get('length');
    
    var ret = '';
    if(format === 'Text') ret += '#================================================================================\n';
    else ret += '<h1>';
    
    if(projectName === CoreTasks.UNALLOCATED_TASKS_NAME.loc() || projectName === CoreTasks.UNASSIGNED_TASKS_NAME.loc()) {
      if(format === 'Text') ret += '# ';
      ret += projectName.loc();
    }
    else {
      
      if(format === 'HTML') ret += '&nbsp;<span class="' + developmentStatus.loc().toLowerCase() + '">';
      ret += projectName;
      if(format === 'HTML') ret += '</span>';
      
      if(format === 'Text') {
        var timeLeft = this.get('timeLeft');
        if(timeLeft) ret += (' {' + CoreTasks.displayTime(timeLeft) + '}');
        var activatedAt = this.get('activatedAt');
        if(activatedAt) ret += (' <' + activatedAt.toFormattedString(CoreTasks.DATE_FORMAT) + '>');
      }
      else {
        var countDown = this.get('displayCountDown');
        if(countDown) ret += ('&nbsp;<span class="time">' + countDown + '</span>');
      }
      
    }
    
    if(format === 'Text') {
      if(developmentStatus !== CoreTasks.STATUS_PLANNED) ret += ' @' + developmentStatus.loc();
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
    if(format === 'Text') ret += '#================================================================================\n';
    ret += '\n';
    return ret;
    
  },
  
  /**
   * Destroys the project and orphans any tasks that are in it.
   */
  destroy: function() {
    // console.log('DEBUG: destroying Project: ' + this.get('name'));
    sc_super();

    var tasks = this.get('tasks');
    if (tasks) {
      tasks.forEach(function(task) {
        task.set('projectId', null);
      });
      this.get('tasks').destroy();
    }
  }

});

CoreTasks.Project.mixin(/** @scope CoreTasks.Project */ {
  
  resourcePath: 'project',

  /**
   * Parse a string and extract timeLeft from it.
   *
   * @param {String} string to extract timeLeft from.
   * @returns {String} project timeLeft.
   */
  parseTimeLeft: function(line) {
    
    var projectTimeLeft = null;
    
    var matches = line.match(/\{/g);
    if(matches !== null) {
      if(matches.length === 1) {
        var projectTimeLeftMatches = /\{(\d+\.\d+|\d+)(|d|h)\}/.exec(line);
        if(projectTimeLeftMatches) {
          projectTimeLeft = projectTimeLeftMatches[1];
          if(projectTimeLeftMatches[2]) projectTimeLeft += projectTimeLeftMatches[2]; // append provided time unit
        }
        else {
          console.warn('Project Parsing Error - illegal timeLeft');
        }
      }
      else {
        console.warn('Project Parsing Error - multiple timeLefts illegal');
      }
    }
    
    return projectTimeLeft;
    
  },

  /**
   * Parse a string and extract activatedAt from it.
   *
   * @param {String} string to extract activatedAt from.
   * @returns {String} project activatedAt.
   */
  parseActivatedAt: function(line) {
    
    var projectActivatedAt = null;
    
    var matches = line.match(/</g);
    if(matches !== null) {
      if(matches.length === 1) {
        var projectActivatedAtMatches = /<(.*)>/.exec(line);
        if(projectActivatedAtMatches) {
          projectActivatedAt = projectActivatedAtMatches[1];
        }
        else {
          console.warn('Project Parsing Error - illegal activatedAt');
        }
      }
      else {
        console.warn('Project Parsing Error - multiple activatedAts illegal');
      }
    }
    
    return projectActivatedAt;
    
  },

  /**
   * Parse a line of text and extract parameters from it.
   *
   * @param {String} string to extract parameters from.
   * @param (Boolean) optional parameter to specify if defaults are to be filled in
   * @returns {Object} Hash of parsed parameters.
   */
  parse: function(line, fillDefaults) {
    
    // extract project name
    var projectName = line;
    var projectNameMatches = line.match(/^([^\{<\@#]+)/);
    if(projectNameMatches) {
      projectName = projectNameMatches[1].replace(/^\s+/, '').replace(/\s+$/, ''); // trim leading/trailing whitespace, if any
    }

    // extract project timeLeft & activatedAt if provided
    var projectTimeLeft = CoreTasks.Project.parseTimeLeft(line);
    var projectActivatedAt = CoreTasks.Project.parseActivatedAt(line);
    
    // extract project development status
    var projectStatus = fillDefaults? CoreTasks.STATUS_PLANNED : null;
    var projectStatusMatches = line.match(/@(\w+)/g);
    if(projectStatusMatches) {
      if(projectStatusMatches.length === 1) {
        var status = CoreTasks.normalizeLocalizedString('_' + projectStatusMatches[0].slice(1));
        if(CoreTasks.projectStatusesAllowed.indexOf(status) === -1) {
          console.warn('Project Parsing Error - illegal status: ' + status);
        }
        else {
          projectStatus = status;
        }
      }
      else {
        console.warn('Project Parsing Error - multiple statuses illegal: ' + projectStatusMatches);
      }
    }

    var ret = {
      name: projectName,
      timeLeft: projectTimeLeft,
      activatedAt: projectActivatedAt,
      developmentStatus: projectStatus,
      tasks: []
    };
    // console.log('DEBUG: Project hash = ' + JSON.stringify(ret));
    return ret;
    
  }
  
});

CoreTasks.Project.NEW_PROJECT_HASH = {
  name: CoreTasks.NEW_PROJECT_NAME,
  developmentStatus: CoreTasks.STATUS_PLANNED
};
