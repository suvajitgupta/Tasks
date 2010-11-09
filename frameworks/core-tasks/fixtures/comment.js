/*globals CoreTasks sc_require */

sc_require('models/comment');

CoreTasks.Comment.FIXTURES = [];

for (var i = 0, j = 0; i < 25; i = i+4) {
  CoreTasks.Comment.FIXTURES[j++] = { id: j+2, taskId: i+1, userId: 1, description: 'Short comment' };
  CoreTasks.Comment.FIXTURES[j++] = { id: j+2, taskId: i+1, userId: 1,
    description: 'This is a much longer comment that spans multiple lines.\n' +
                 'It is used to test how such a long comment will be rendered.\n\n' +
                 'Such comments are common since people like to collaborate.'
  };
}
