/**
 * Unit test for Task model
 *
 * @author Suvajit Gupta
 */
/*globals Tasks sc_require module test equals ok */
sc_require('core');
sc_require('models/task');

var task; // task instance with data

module("Tasks.Task", {

  setup: function() {    
    var taskHash = {
      id: 0,
      name: "Summary for task zero",
      type: Tasks.TASK_TYPE_FEATURE,
      description: "Description for task 0" ,
      priority: Tasks.TASK_PRIORITY_HIGH,
      status: Tasks.TASK_STATUS_DONE,
      validation: Tasks.TASK_VALIDATION_PASSED,
      effort: "5",
      submitter: 1,
      assignee: 2
    };
    task = Tasks.get('store').createRecord(Tasks.Task, taskHash);
  },

  teardown: function() {
    task = null; // reset
  }
  
});

test("Function: displayName()",
function() {
  equals(task.get('displayName'), "Summary for task zero {5}", "displayName() should show name with effort appended in curly braces");
});
