/*globals Tasks sc_require */

sc_require('models/project');

Tasks.Project.FIXTURES = [];

/**
 * Generate a few project fixtures referencing task fixtures.
 */
for (var i = 0; i < 5; i++) {
  var projectHash = {};
  projectHash.id = i+1;
  projectHash.name = "Project" + projectHash.id;
  var t = 4*i;
  projectHash.tasks = [ t+1, t+2, t+3, t+4 ];
  if (i < 3) projectHash.timeLeft = t*t;
  Tasks.Project.FIXTURES[i] = projectHash;
}
