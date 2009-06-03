// ==========================================================================
// Project:   Tasks.Task Fixtures
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Tasks */

require('models/task');

Tasks.Task.FIXTURES = [

  { "guid": "task-1",
    "description": "Build my first SproutCore app",
    "assignee": "SG",
    "isDone": false },

  { "guid": "task-2",
    "description": "Build a really awesome SproutCore app",
    "assignee": "MB",
		"estimate": "2d",
    "isDone": false },

  { "guid": "task-3",
    "description": "Next, the world...",
		"estimate": "4h",
    "isDone": false },

  { "guid": "task-4",
    "description": "Finally, the universe!",
		"estimate": "4w",
		"assignee": "EG",
    "isDone": true }


];
