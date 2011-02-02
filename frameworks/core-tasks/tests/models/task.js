/**
 * CoreTasks.Task Unit Test
 *
 * @author Brandon Blatnick
 * @author Suvajit Gupta
 */
/*globals CoreTasks sc_require module CoreTasks equals test*/
// http://localhost:4400/core-tasks/en/current/tests/models/task.html
sc_require('core');
sc_require('models/task');

var doneTask; 

module("CoreTasks.Task", {

  setup: function() {
    
    CoreTasks.initStore();
    var doneTaskHash = {
      name: CoreTasks.NEW_TASK_NAME,
      developmentStatus: CoreTasks.STATUS_DONE,
      validation: CoreTasks.TASK_VALIDATION_PASSED
    };
    doneTask = CoreTasks.createRecord(CoreTasks.Task, doneTaskHash);

  },

  teardown: function() {
    
    doneTask.destroy();
    doneTask = null;
    
  }
});

test("Computed Property: projectValue",
function() {

  doneTask.set('projectId', null);
  equals(doneTask.get('projectValue'), 0, "set projectId to null, projectValue is");
  
  doneTask.set('projectValue', 0);
  equals(doneTask.get('projectId'), null, "set projectValue to 0, projectId is");
  
  doneTask.set('projectId', 100);
  equals(doneTask.get('projectValue'), 100, "set projectId to 100, projectValue is");

});

test("Computed Property: displayEffort",
function() {

  doneTask.set('effort', '2h');
  equals(doneTask.get('displayEffort'), '2h', "effort with unit appended");

  doneTask.set('effort', '2');
  equals(doneTask.get('displayEffort'), '2d', "effort with unit missing, should be in days");

});

test("Computed Property: effortValue",
function() {

  doneTask.set('effortValue', '');
  equals(doneTask.get('displayEffort'), null, "set effort value to ''");

  doneTask.set('effortValue', '33');
  equals(doneTask.get('effortValue'), '33', "set effortValue to 33, effortValue is");
  equals(doneTask.get('displayEffort'), '33d', "set effortValue to 33, displayEffort is");

});

test("Computed Property: developmentStatusWithValidation",
function() {

  equals(doneTask.get('developmentStatus'), CoreTasks.STATUS_DONE, "developmentStatus initialized to");
  equals(doneTask.get('validation'), CoreTasks.TASK_VALIDATION_PASSED, "validation initialized to");
  doneTask.set('developmentStatusWithValidation', CoreTasks.STATUS_ACTIVE);
  equals(doneTask.get('developmentStatus'), CoreTasks.STATUS_ACTIVE, "developmentStatus changed to");
  equals(doneTask.get('validation'), CoreTasks.TASK_VALIDATION_UNTESTED, "validation adjusted to");

});

test("Computed Property: icon",
function() {

  equals(doneTask.get('icon'), 'task-icon-other', "icon is");

});

