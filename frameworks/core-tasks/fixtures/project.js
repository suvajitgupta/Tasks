/*globals CoreTasks sc_require */

sc_require('models/project');

CoreTasks.Project.FIXTURES = [];

for (var i = 0; i < 7; i++) {
  var projectHash = {};
  projectHash.id = i+1;
  projectHash.name = "Project" + projectHash.id;
  if (i%2) {
    projectHash.timeLeft = projectHash.id;
  }
  else {
    projectHash.description = "Description" + projectHash.id;
  }
  CoreTasks.Project.FIXTURES[i] = projectHash;
}
