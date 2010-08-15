/*globals CoreTasks sc_require */

sc_require('models/watch');

CoreTasks.Watch.FIXTURES = [];

for (var i = 0, j = 0; i < 25; i = i+4, j++) {
  CoreTasks.Watch.FIXTURES[j] = { id: j+1, taskId: i+1, userId: 1 };
}
