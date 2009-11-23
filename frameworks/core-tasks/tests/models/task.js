/**
 * CoreTasks.Task Unit Test
 *
 * @author Brandon Blatnick
 */
/*globals CoreTasks */
// http://localhost:4400/core-tasks/en/current/tests/models/task.html
sc_require('core');
sc_require('models/task');

var task; 

module("CoreTasks.Task", {

  setup: function() {
    
    var taskHash = {
      name: CoreTasks.NEW_TASK_NAME
    };

    task = CoreTasks.createRecord(CoreTasks.Task, taskHash);

  },

  teardown: function() {
    
    task.destroy();
    task = null;
    
  }
});

test("Computed Property: projectValue",
function() {

  task.set('projectId', 100);
  equals(task.get('projectValue'), 100, "acceptable projectValue retrieval");

  task.set('projectId', null);
  equals(task.get('projectValue'), 0, "null projectValue retrieval");
  
  SC.RunLoop.begin();
  task.set('projectId', null);
  SC.RunLoop.end();
  equals(task.get('projectValue'), 0, "0 projectValue setting");
  
});


test("Computed Property: projectValue",
function() {

  task.set('effort', '2h');
  equals(task.get('displayEffort'), '2h', "effort with unit appended");

  task.set('effort', '2');
  equals(task.get('displayEffort'), '2d', "effort with unit missing, should be in days");

});

