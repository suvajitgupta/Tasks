// ==========================================================================
// Project: Tasks
// Copyright: 2009 Eloqua Limited 
// ==========================================================================

sc_require('models/record');

Tasks.consts.NEW_PROJECT_NAME = "_NewProject".loc();

/**
 * The project model.
 *
 * TODO: Add more descriptive docs.
 *
 * @extends Tasks.Record
 * @author Suvajit Gupta
 */
Tasks.Project = Tasks.Record.extend(/** @scope Tasks.Project.prototype */ {

  /**
   * The name of the project (ex. "FR1").
   */
  name: SC.Record.attr(String, { isRequired: YES, defaultValue: Tasks.consts.NEW_PROJECT_NAME }),

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
   * The path to the icon associated with this project.
   */
  icon: function() {
    return 'sc-icon-folder-16';
  }.property().cacheable(),

  /**
   * The full name of the project including time left (ex. "FR1 {4.5}").
   */
  displayName: function() {
    var name = this.get('name');
    var timeLeft = this.get('timeLeft');
    var ret = name;
    if (timeLeft) ret += ' {' + timeLeft + '}';
    return ret;
  }.property('name', 'timeLeft').cacheable()
  
});
