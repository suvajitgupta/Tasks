// ==========================================================================
// Tasks.filterSearchController
// ==========================================================================
/*globals CoreTasks Tasks */

Tasks.attributeFilterNone = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_DONE, CoreTasks.STATUS_RISKY,
  CoreTasks.TASK_VALIDATION_UNTESTED, CoreTasks.TASK_VALIDATION_PASSED, CoreTasks.TASK_VALIDATION_FAILED
];

Tasks.attributeFilterShowstoppers = [
  CoreTasks.TASK_TYPE_BUG,
  CoreTasks.TASK_PRIORITY_HIGH,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_DONE, CoreTasks.STATUS_RISKY,
  CoreTasks.TASK_VALIDATION_FAILED
];

Tasks.attributeFilterUrgent = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_RISKY,
  CoreTasks.TASK_VALIDATION_UNTESTED, CoreTasks.TASK_VALIDATION_PASSED, CoreTasks.TASK_VALIDATION_FAILED
];

Tasks.attributeFilterTroubled = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_RISKY
];
if(Tasks.softwareMode) Tasks.attributeFilterTroubled.pushObjects([CoreTasks.STATUS_DONE, CoreTasks.TASK_VALIDATION_FAILED]);

Tasks.attributeFilterUnfinished = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_RISKY
];
if(Tasks.softwareMode) Tasks.attributeFilterUnfinished.pushObjects([CoreTasks.STATUS_DONE, CoreTasks.TASK_VALIDATION_FAILED]);

Tasks.attributeFilterUnvalidated = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_DONE,
  CoreTasks.TASK_VALIDATION_UNTESTED
];

Tasks.attributeFilterUpcoming = [
  CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_PLANNED, CoreTasks.STATUS_ACTIVE, CoreTasks.STATUS_RISKY,
  CoreTasks.TASK_VALIDATION_UNTESTED, CoreTasks.TASK_VALIDATION_PASSED, CoreTasks.TASK_VALIDATION_FAILED
];

Tasks.attributeFilterCompleted = [
CoreTasks.TASK_TYPE_FEATURE, CoreTasks.TASK_TYPE_BUG, CoreTasks.TASK_TYPE_OTHER,
  CoreTasks.TASK_PRIORITY_HIGH, CoreTasks.TASK_PRIORITY_MEDIUM, CoreTasks.TASK_PRIORITY_LOW,
  CoreTasks.STATUS_DONE,
  (Tasks.softwareMode? CoreTasks.TASK_VALIDATION_PASSED : CoreTasks.TASK_VALIDATION_UNTESTED)
];

Tasks.FILTER_DONT_CARE = -1;
Tasks.FILTER_YES = 0;
Tasks.FILTER_NO = 1;
Tasks.FILTER_MY_WATCHES = 0;
Tasks.FILTER_ANY_WATCHES = 1;

/** @static
  
  @extends SC.ObjectController
  @author Suvajit Gupta
  
  Controller for tasks filtering and searching.
*/
Tasks.filterSearchController = SC.ObjectController.create(
/** @scope Tasks.filterSearchController.prototype */ {
  
  attributeFilterCriteria: Tasks.attributeFilterNone.slice(0),
  effortSpecified: Tasks.FILTER_DONT_CARE,
  recentlyUpdated: Tasks.FILTER_DONT_CARE,
  watched: Tasks.FILTER_DONT_CARE,

  attributeFilter: function(name, value) {
    var newFilterCriteria;
    if (value !== undefined) {
      if(value) { // if not included, add attribute to filter
        if(this.attributeFilterCriteria.indexOf(name) === -1) {
          newFilterCriteria = this.attributeFilterCriteria.splice(0);
          newFilterCriteria.push(name);
          this.set('attributeFilterCriteria', newFilterCriteria);
        }
      }
      else { // if included, remove attribute from filter
        var idx = this.attributeFilterCriteria.indexOf(name);
        if (idx !== -1) {
          newFilterCriteria = this.attributeFilterCriteria.splice(0);
          newFilterCriteria.splice(idx, 1);
          this.set('attributeFilterCriteria', newFilterCriteria);
        }
      }
      return this;
    }
    else { // see if attribute is in filter
      return (this.attributeFilterCriteria.indexOf(name) !== -1);
    }
  },
  
  setAttributeFilterNone: function() {
    this.clearAttributeFilterCriteria();
  },

  setAttributeFilterShowstoppers: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterShowstoppers.slice(0));
  },

  setAttributeFilterUrgent: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterUrgent.slice(0));
  },

  setAttributeFilterTroubled: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterTroubled.slice(0));
  },

  setAttributeFilterUnfinished: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterUnfinished.slice(0));
  },

  setAttributeFilterUpcoming: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterUpcoming.slice(0));
  },

  setAttributeFilterUnvalidated: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterUnvalidated.slice(0));
  },

  setAttributeFilterCompleted: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterCompleted.slice(0));
  },

  attributeFilterTypeFeature: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_TYPE_FEATURE, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterTypeBug: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_TYPE_BUG, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterTypeOther: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_TYPE_OTHER, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterPriorityHigh: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_PRIORITY_HIGH, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterPriorityMedium: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_PRIORITY_MEDIUM, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterPriorityLow: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_PRIORITY_LOW, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusPlanned: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_PLANNED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusActive: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_ACTIVE, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusDone: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_DONE, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterStatusRisky: function(key, value) {
    return this.attributeFilter(CoreTasks.STATUS_RISKY, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterValidationUntested: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_VALIDATION_UNTESTED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterValidationPassed: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_VALIDATION_PASSED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterValidationFailed: function(key, value) {
    return this.attributeFilter(CoreTasks.TASK_VALIDATION_FAILED, value);
  }.property('attributeFilterCriteria'),
  
  attributeFilterCriteriaCopy: null,
  effortSpecifiedCopy: null,
  recentlyUpdatedCopy: null,
  watchedCopy: null,
  
  backupAttributeFilterCriteria: function() {
    this.attributeFilterCriteriaCopy = this.attributeFilterCriteria.slice(0);
    this.effortSpecifiedCopy = this.effortSpecified;
    this.recentlyUpdatedCopy = this.recentlyUpdated;
    this.watchedCopy = this.watched;
  },
  
  restoreAttributeFilterCriteria: function() {
    this.set('attributeFilterCriteria', this.attributeFilterCriteriaCopy);
    this.set('effortSpecified', this.effortSpecifiedCopy);
    this.set('recentlyUpdated', this.recentlyUpdatedCopy);
    this.set('watched', this.watchedCopy);
  },
  
  clearAttributeFilterCriteria: function() {
    this.set('attributeFilterCriteria', Tasks.attributeFilterNone.slice(0));
    this.set('effortSpecified', Tasks.FILTER_DONT_CARE);
    this.set('recentlyUpdated', Tasks.FILTER_DONT_CARE);
    this.set('watched', Tasks.FILTER_DONT_CARE);
  },
  
  isAttributeFilterEnabled: function() {
    return (this.attributeFilterCriteria.length !== 13 || this.effortSpecified !== Tasks.FILTER_DONT_CARE ||
           this.recentlyUpdated !== Tasks.FILTER_DONT_CARE || this.watched !== Tasks.FILTER_DONT_CARE)?
    true : false;
  }.property('attributeFilterCriteria', 'effortSpecified', 'recentlyUpdated', 'watched').cacheable(),
  
  
  tasksSearch: null,
  
  /**
   * Set filter to show specified assignee's tasks or clear assignee if not specified.
   */
  setAssigneeTasksSearch: function(assignee) {
    var newAssigneeSelection = (SC.none(assignee)? '' : '[' + assignee + ']');
    var tasksSearch = this.get('tasksSearch');
    // console.log('DEBUG: setAssigneeTasksSearch("' + (SC.none(assignee)? '' : assignee) + '") tasksSearch is: "' + tasksSearch + '"');
    if(tasksSearch !== null && tasksSearch !== '') {
      var assigneeSelection = tasksSearch.match(/\[.*\]/);
      if (assigneeSelection) { // if assignee selection is specified
        assigneeSelection += ''; // convert to string
        tasksSearch = tasksSearch.replace(assigneeSelection, newAssigneeSelection);
      }
      else {
        tasksSearch = (newAssigneeSelection !== ''? newAssigneeSelection + ' ' : '') + tasksSearch.replace(/^\s+/, '');
      }
    }
    else {
      tasksSearch = newAssigneeSelection;
    }
    // console.log('DEBUG: setting tasksSearch to: "' + tasksSearch + '"');
    this.set('tasksSearch', tasksSearch);
  },
  
  /**
   * Set filter to show current user's tasks.
   */
  setCurrentUserTasksSearch: function() {
    this.setAssigneeTasksSearch(Tasks.get('loginName'));
  },
  
  
  isFilterOrSearchEnabled: function() {
    return this.tasksSearch || this.attributeFilterCriteria.length !== 13;
  }
    
});