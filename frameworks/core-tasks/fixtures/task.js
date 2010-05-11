/*globals CoreTasks sc_require */

sc_require('models/task');

function loc(str) {
  return str.replace('_', '');
}

CoreTasks.Task.FIXTURES = [];

for (var i = 0; i < 25; i++) {
  var taskHash = {};
  if (i%5 === 0) {
    taskHash.createdAt = taskHash.updatedAt = SC.DateTime.create().get('milliseconds');
  }
  taskHash.id = i+1;
  taskHash.priority = CoreTasks.taskPrioritiesAllowed[i%3];
  taskHash.type = CoreTasks.taskTypesAllowed[i%3];
  taskHash.developmentStatus = CoreTasks.taskStatusesAllowed[i%4];
  if(taskHash.developmentStatus === CoreTasks.STATUS_DONE) {
    taskHash.validation = CoreTasks.taskValidationsAllowed[i%3];
  }
  if(i > 5) taskHash.projectId = taskHash.id%5 + 1;
  taskHash.submitterId = (i%2? 1 : 4);
  taskHash.assigneeId = taskHash.id%3 + 1;
  if (i%2) {
    taskHash.effort = taskHash.id;
  }
  else {
    taskHash.description = "Description" + taskHash.id;
  }
  var status = taskHash.developmentStatus;
  taskHash.name = "Task" + taskHash.id + " type:" + loc(taskHash.type) + " priority:" + loc(taskHash.priority) + " status:" + loc(taskHash.developmentStatus);
  if(taskHash.developmentStatus === CoreTasks.STATUS_DONE) {
    taskHash.name += (" validation:" + loc(taskHash.validation));
  }
  CoreTasks.Task.FIXTURES[i] = taskHash;
}
