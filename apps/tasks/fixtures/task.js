// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks sc_require */

/** @class

  @version 0.1
	@author Suvajit Gupta
*/

sc_require('models/task');

Tasks.Task.FIXTURES = [

	{ id: 1,
	name: "Summary for task one",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_DONE,
	effort: "1",
	submitter: 1,
	assignee: 2,
	projectID: 1
	},

	{ id: 2,
	name: "Summary for task two",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_ACTIVE,
	effort: "0.25",
	submitter: 1,
	assignee: 2,
	projectID: 1 },

	{ id: 3,
	name: "Summary for task three",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_AT_RISK,
	submitter: 1,
	assignee: 2,
	projectID: 1 },

	{ id: 4,
	name: "Summary for task four",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_ACTIVE,
	effort: "3-5",
	submitter: 4,
	assignee: 3,
	projectID: 2 },

	{ id: 5,
	name: "Summary for task five",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "5",
	submitter: 4,
	assignee: 3,
	projectID: 2 },

	{ id: 6,
	name: "Summary for task six",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "1-2",
	submitter: 4,
	assignee: 3,
	projectID: 2 },

	{ id: 7,
	name: "Summary for task seven",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "2",
	submitter: 2,
	assignee: 3,
	projectID: 3 },

	{ id: 8,
	name: "Summary for task eight",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "5",
	submitter: 2,
	assignee: 3,
	projectID: 3 },

	{ id: 9,
	name: "Summary for task nine",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	submitter: 1,
	assignee: 3,
	projectID: 3 },

	{ id: 10,
	name: "Summary for task ten",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_VALIDATION_PASSED,
	effort: "1",
	submitter: 4,
	assignee: 2,
	projectID: 4 },

	{ id: 11,
	name: "Summary for task eleven",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_PRIORITY_MEDIUM,
	effort: "0.5",
	submitter: 1,
	assignee: 2,
	projectID: 4 },

	{ id: 12,
	name: "Summary for task twelve",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_LOW,
	status: Tasks.consts.TASK_STATUS_AT_RISK,
	effort: "10",
	submitter: 1,
	assignee: 2,
	projectID: 4 },

	{ id: 13,
	name: "Summary for task thirteen",
	priority: Tasks.consts.TASK_PRIORITY_LOW,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "1",
	submitter: 3,
	assignee: 2,
	projectID: 4 },

	{ id: 14,
	name: "Summary for task fourteen",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_ACTIVE,
	submitter: 1,
	assignee: 2,
	projectID: 4 },

	{ id: 15,
	name: "Summary for task fifteen",
	description: "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	submitter: 1,
	assignee: 2,
	projectID: 4 }

];
