// ==========================================================================
// Project:   Tasks.Task Fixtures
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

require('models/task');

Tasks.Task.FIXTURES = [

	{ "guid": "t1",
	"summary": "Summary for task one",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Done",
	"effort": "1d",
	"submitter": "Manager1",
	"assignee": "Developer1" },

	{ "guid": "t2",
	"summary": "Summary for task two",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Active",
	"effort": "2h",
	"submitter": "Manager1",
	"assignee": "Developer1" },

	{ "guid": "t3",
	"summary": "Summary for task three",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "AtRisk",
	"submitter": "Manager1",
	"assignee": "Developer1" },

	{ "guid": "t4",
	"summary": "Summary for task four",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Active",
	"effort": "3-5d",
	"submitter": "Tester1",
	"assignee": "Developer2" },

	{ "guid": "t5",
	"summary": "Summary for task five",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Planned",
	"effort": "5d",
	"submitter": "Tester1",
	"assignee": "Developer2" },

	{ "guid": "t6",
	"summary": "Summary for task six",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Planned",
	"effort": "1-2d",
	"submitter": "Tester1",
	"assignee": "Developer2" },

	{ "guid": "t7",
	"summary": "Summary for task seven",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Planned",
	"effort": "2d",
	"submitter": "Manager1",
	"assignee": "Developer3" },

	{ "guid": "t8",
	"summary": "Summary for task eight",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Planned",
	"effort": "1w",
	"submitter": "Manager1",
	"assignee": "Developer3" },

	{ "guid": "t9",
	"summary": "Summary for task nine",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Planned",
	"submitter": "Manager1",
	"assignee": "Developer3" },

	{ "guid": "t10",
	"summary": "Summary for task ten",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Passed",
	"effort": "1d",
	"submitter": "Tester2",
	"assignee": "Developer3" },

	{ "guid": "t11",
	"summary": "Summary for task eleven",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "High",
	"status": "Med",
	"effort": "4h",
	"submitter": "Manager1",
	"assignee": "Developer4" },

	{ "guid": "t12",
	"summary": "Summary for task twelve",
	 "description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "Low",
	"status": "AtRisk",
	"effort": "2w",
	"submitter": "Manager1",
	"assignee": "Developer4" },

	{ "guid": "t13",
	"summary": "Summary for task thirteen",
	"description": "A long paragraph describing what this task is about and capturing any release notes that need to be conveyed to Testers",
	"priority": "Med",
	"status": "Planned",
	"submitter": "Manager1",
	"assignee": "Unassigned" }

];
