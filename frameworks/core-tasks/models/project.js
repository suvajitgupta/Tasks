/*globals CoreTasks sc_require */

sc_require('models/record');

CoreTasks.NEW_PROJECT_NAME = '_NewProject';
CoreTasks.INBOX_PROJECT_NAME = '_InboxProject';

/**
 * The project model.
 *
 * A project is a container for tasks
 *
 * @extends CoreTasks.Record
 * @author Suvajit Gupta
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
  timeLeft: SC.Record.attr(Number),

  /**
   * The list of tasks associated with this project.
   */
  tasks: SC.Record.toMany('CoreTasks.Task'),

  /**
   * The path to the icon associated with a project.
   */
  icon: function() {
    return 'sc-icon-folder-16';
  }.property().cacheable(),

  /**
   * A string summarizing key facets of the Project for display.
   */
  displayName: function(key, value) {
    if (value !== undefined) {
      this.propertyWillChange('name');
      this.writeAttribute('name', value);
      this.propertyDidChange('name');
    } else {
      var name = this.get('name');
      var timeLeft = this.get('timeLeft');
      var ret = name;
      if (timeLeft) ret += ' {' + timeLeft + '}';
      return ret;
    }
  }.property('name', 'timeLeft').cacheable()
  
});

CoreTasks.Project.mixin(/** @scope CoreTasks.Project */ {
  callbacks: SC.Object.create(),
  resourcePath: 'project'
});
