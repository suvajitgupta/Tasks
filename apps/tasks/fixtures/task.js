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
	type: Tasks.consts.TASK_TYPE_OTHER,
	description: "First line of description for task 1\nSecond line of description\nThird line of description" ,
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_DONE,
	validation: Tasks.consts.TASK_VALIDATION_PASSED,
	effort: "1",
	submitter: 1
	},

	{ id: 2,
	name: "Summary for task two",
	description: "Description for task 2" ,
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_ACTIVE,
	effort: "0.25",
	submitter: 1,
	assignee: 2
	},

	{ id: 3,
	name: "Summary for task three",
	description: "Description for task 3" ,
	type: Tasks.consts.TASK_TYPE_OTHER,
	priority: Tasks.consts.TASK_PRIORITY_LOW,
	status: Tasks.consts.TASK_STATUS_AT_RISK,
	submitter: 1,
	assignee: 2
	},

	{ id: 4,
	name: "Summary for task four",
	description: "Description for task 4" ,
	type: Tasks.consts.TASK_TYPE_BUG,
	priority: Tasks.consts.TASK_PRIORITY_LOW,
	status: Tasks.consts.TASK_STATUS_ACTIVE,
	effort: "3-5",
	submitter: 4,
	assignee: 3
	},

	{ id: 5,
	name: "Summary for task five",
	description: "Description for task 5" ,
	type: Tasks.consts.TASK_TYPE_OTHER,
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "5",
	submitter: 4,
	assignee: 2
	},

	{ id: 6,
	name: "Summary for task six",
	description: "Description for task 6" ,
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "1-2",
	submitter: 4
	},

	{ id: 7,
	name: "Summary for task seven",
	description: "Description for task 7" ,
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "2",
	submitter: 2,
	assignee: 3
	},

	{ id: 8,
	name: "Summary for task eight",
	type: Tasks.consts.TASK_TYPE_BUG,
	description: "Description for task 8" ,
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "5",
	submitter: 2,
	assignee: 2
	},

	{ id: 9,
	name: "Summary for task nine",
	description: "Description for task 9" ,
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	submitter: 1,
	assignee: 3
	},

	{ id: 10,
	name: "Summary for task ten",
	description: "Description for task 10" ,
	type: Tasks.consts.TASK_TYPE_BUG,
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_STATUS_DONE,
	validation: Tasks.consts.TASK_VALIDATION_NOT_TESTED,
	effort: "1",
	submitter: 4,
	assignee: 2
	},

	{ id: 11,
	name: "Summary for task eleven",
	description: "Description for task 11" ,
	priority: Tasks.consts.TASK_PRIORITY_HIGH,
	status: Tasks.consts.TASK_PRIORITY_MEDIUM,
	effort: "0.5",
	submitter: 1,
	assignee: 3
	},

	{ id: 12,
	name: "Summary for task twelve",
	description: "Description for task 12" ,
	priority: Tasks.consts.TASK_PRIORITY_LOW,
	status: Tasks.consts.TASK_STATUS_AT_RISK,
	effort: "10",
	submitter: 1,
	assignee: 2
	},

	{ id: 13,
	name: "Summary for task thirteen",
	priority: Tasks.consts.TASK_PRIORITY_LOW,
	status: Tasks.consts.TASK_STATUS_PLANNED,
	effort: "1",
	submitter: 3,
	assignee: 2
	},

	{ id: 14,
	name: "Summary for task fourteen",
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_ACTIVE,
	submitter: 1,
	assignee: 3
	},

	{ id: 15,
	name: "Summary for task fifteen",
	description: "A very long paragraph providing excruciating details for task 15.  It goes on and on until the reader is bored to tears and causes a buffer overflow in the viewer." ,
	priority: Tasks.consts.TASK_PRIORITY_MEDIUM,
	status: Tasks.consts.TASK_STATUS_FAILED,
	validation: Tasks.consts.TASK_VALIDATION_FAILED,
	submitter: 1,
	assignee: 2
	}

];
