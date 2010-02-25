/*globals CoreTasks sc_require */

sc_require('models/task');

CoreTasks.Task.FIXTURES = [];

for (var i = 0; i < 25; i++) {
  var taskHash = {};
  taskHash.id = i+1;
  taskHash.name = taskHash.id + ". Task";
  taskHash.priority = CoreTasks.taskPrioritiesAllowed[i%3];
  taskHash.type = CoreTasks.taskTypesAllowed[i%3];
  taskHash.developmentStatus = CoreTasks.taskStatusesAllowed[i%4];
  if(taskHash.developmentStatus === CoreTasks.TASK_STATUS_DONE) {
    taskHash.validation = CoreTasks.taskValidationsAllowed[i%3];
  }
  taskHash.projectId = taskHash.id%5 + 1;
  taskHash.submitterId = taskHash.id%4 + 1;
  taskHash.assigneeId = taskHash.id%4 + 1;
  if (i%2) {
    taskHash.effort = taskHash.id;
  }
  else {
    taskHash.description = "Description" + taskHash.id;
  }
  CoreTasks.Task.FIXTURES[i] = taskHash;
}
