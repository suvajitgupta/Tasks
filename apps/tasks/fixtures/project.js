// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/project');

Tasks.Project.FIXTURES = [];

function generateProjectFixtures() {
	var fixtures = Tasks.Project.FIXTURES;
	for (var i = 0; i < 10; i++) {
		var project = new Tasks.Project();
		project.id = i+1;
		project.name = "Project" + project.id;
		fixtures[i] = project;
	}
}

generateProjectFixtures();