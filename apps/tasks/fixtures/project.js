// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/project');

Tasks.Project.FIXTURES = [];

function generateProjectFixtures() {
	var fixtures = Tasks.Project.FIXTURES;
	for (var i = 0; i < 5; i++) {
		var project = new Tasks.Project();
		project.id = i+1;
		project.name = "Project" + project.id;
		var t = 3*i;
		project.tasks = [ t+1, t+2, t+3 ];
		fixtures[i] = project;
	}
}

generateProjectFixtures();