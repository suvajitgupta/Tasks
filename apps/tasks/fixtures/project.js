// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks sc_require */

sc_require('models/project');

Tasks.Project.FIXTURES = [];


for (var i = 0; i < 5; i++) {
	var projectHash = {};
	projectHash.id = i+1;
	projectHash.name = "Project" + projectHash.id;
	var t = 3*i;
	projectHash.tasks = [ t+1, t+2, t+3 ];
	Tasks.Project.FIXTURES[i] = projectHash;
}
