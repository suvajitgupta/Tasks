// ==========================================================================
// Project:   Tasks
// ==========================================================================
/*globals Tasks sc_require */

/** @class

  @version 0.1
	@author Suvajit Gupta
*/

sc_require('models/project');

Tasks.Project.FIXTURES = [];

for (var i = 0; i < 5; i++) {
	var projectHash = {};
	projectHash.id = i+1;
	projectHash.name = "Project" + projectHash.id;
	var t = 3*i;
	projectHash.tasks = [ t+1, t+2, t+3 ];
	if (i < 3) projectHash.timeLeft = t*t;
	Tasks.Project.FIXTURES[i] = projectHash;
}
