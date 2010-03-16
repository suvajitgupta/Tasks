/*globals CoreTasks sc_require */

sc_require('models/watch');

CoreTasks.Watch.FIXTURES = [];

for (var i = 0; i < 16; i++) {
  CoreTasks.Watch.FIXTURES[i] = { id: i+1, taskId: i+1, userId: i%4 + 1};
}
