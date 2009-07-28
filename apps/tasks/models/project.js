/*globals Tasks sc_require */

sc_require('models/record');

Tasks.NEW_PROJECT_NAME = "_NewProject".loc();
Tasks.INBOX_PROJECT_NAME = "_InboxProject".loc();

/**
 * The project model.
 *
 * A project is a container for tasks
 *
 * @extends Tasks.Record
 * @author Suvajit Gupta
 */
// TODO: [SE] refactor all model objects to core framework across all Task GUIs
Tasks.Project = Tasks.Record.extend(/** @scope Tasks.Project.prototype */ {

  /**
   * The name of the project (ex. "FR1").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.NEW_PROJECT_NAME }),

  /**
   * The amount of time remaining before project completion, expressed in days.
   *
   * This is used for load-balancing.
   */
  timeLeft: SC.Record.attr(Number),

  /**
   * The list of tasks associated with this project.
   */
  tasks: SC.Record.toMany('Tasks.Task'),

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
      this.name = value ;
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
