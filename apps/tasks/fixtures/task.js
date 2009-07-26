/*globals Tasks sc_require */

sc_require('models/task');

/**
 * Some task fixtures to provide good coverage of the various test scenarios.
 */
Tasks.Task.FIXTURES = [

  { id: 1,
  name: "Summary for task one",
  type: Tasks.TASK_TYPE_OTHER,
  description: "First line of description for task 1\nSecond line of description\nThird line of description" ,
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_STATUS_DONE,
  validation: Tasks.TASK_VALIDATION_PASSED,
  effort: "1",
  submitter: 1
  },

  { id: 2,
  name: "Summary for task two",
  description: "Description for task 2" ,
  type: Tasks.TASK_TYPE_FEATURE,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_ACTIVE,
  effort: "0.25",
  submitter: 1,
  assignee: 2
  },

  { id: 3,
  name: "Summary for task three",
  description: "Description for task 3" ,
  type: Tasks.TASK_TYPE_OTHER,
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_RISKY,
  submitter: 1,
  assignee: 2
  },

  { id: 4,
  name: "Summary for task four",
  description: "Description for task 4" ,
  type: Tasks.TASK_TYPE_BUG,
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_ACTIVE,
  effort: "3-5",
  submitter: 4,
  assignee: 3
  },

  { id: 5,
  name: "Summary for task five",
  description: "Description for task 5" ,
  type: Tasks.TASK_TYPE_OTHER,
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_STATUS_DONE,
  effort: "5",
  submitter: 4,
  assignee: 2
  },

  { id: 6,
  name: "Summary for task six",
  description: "Description for task 6" ,
  type: Tasks.TASK_TYPE_FEATURE,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_PLANNED,
  effort: "1-2",
  submitter: 4
  },

  { id: 7,
  name: "Summary for task seven",
  description: "Description for task 7" ,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_ACTIVE,
  effort: "2",
  submitter: 2,
  assignee: 3
  },

  { id: 8,
  name: "Summary for task eight",
  type: Tasks.TASK_TYPE_BUG,
  description: "Description for task 8" ,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_RISKY,
  effort: "5",
  submitter: 2,
  assignee: 2
  },

  { id: 9,
  name: "Summary for task nine",
  description: "Description for task 9" ,
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_STATUS_DONE,
  validation: Tasks.TASK_VALIDATION_PASSED,
  submitter: 1
  },

  { id: 10,
  name: "Summary for task ten",
  description: "Description for task 10" ,
  type: Tasks.TASK_TYPE_BUG,
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_STATUS_DONE,
  validation: Tasks.TASK_VALIDATION_PASSED,
  effort: "1",
  submitter: 4,
  assignee: 2
  },

  { id: 11,
  name: "Summary for task eleven",
  description: "Description for task 11" ,
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_PRIORITY_MEDIUM,
  effort: "0.5",
  submitter: 1,
  assignee: 3
  },

  { id: 12,
  name: "Summary for task twelve",
  description: "Description for task 12" ,
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_DONE,
  validation: Tasks.TASK_VALIDATION_FAILED,
  effort: "10",
  submitter: 1,
  assignee: 2
  },

  { id: 13,
  name: "Summary for task thirteen",
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_RISKY,
  effort: "1",
  submitter: 3,
  assignee: 2
  },

  { id: 14,
  name: "Summary for task fourteen",
  type: Tasks.TASK_TYPE_BUG,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_ACTIVE,
  submitter: 1,
  assignee: 3
  },

  { id: 15,
  name: "Summary for task fifteen",
  description: "A very long paragraph providing excruciating details for task 15.  It goes on and on until the reader is bored to tears and causes a buffer overflow in the viewer." ,
  type: Tasks.TASK_TYPE_FEATURE,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_DONE,
  validation: Tasks.TASK_VALIDATION_FAILED,
  submitter: 1,
  assignee: 2
  },

  { id: 16,
  name: "Summary for task sixteen",
  type: Tasks.TASK_TYPE_FEATURE,
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_PLANNED,
  submitter: 2
  },

  { id: 17,
  name: "Summary for task seventeen",
  description: "Short decription for task sixteen" ,
  type: Tasks.TASK_TYPE_OTHER,
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_ACTIVE,
  submitter: 1,
  assignee: 2
  },

  { id: 18,
  name: "Summary for task eighteen",
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_STATUS_DONE,
  validation: Tasks.TASK_VALIDATION_PASSED,
  submitter: 4,
  assignee: 3
  },

  { id: 19,
  name: "Summary for task nineteen",
  priority: Tasks.TASK_PRIORITY_MEDIUM,
  status: Tasks.TASK_STATUS_RISKY,
  validation: Tasks.TASK_VALIDATION_FAILED,
  submitter: 4,
  assignee: 3
  },

  { id: 20,
  name: "Summary for task twenty",
  description: "Short decription for task twenty" ,
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_ACTIVE,
  submitter: 4,
  assignee: 3
  },

  { id: 21,
  name: "Summary for task twenty-one",
  priority: Tasks.TASK_PRIORITY_HIGH,
  status: Tasks.TASK_STATUS_ACTIVE,
  submitter: 4,
  assignee: 2
  },

  { id: 22,
  name: "Summary for task twenty-two",
  description: "Short decription for task twenty-two" ,
  priority: Tasks.TASK_PRIORITY_LOW,
  status: Tasks.TASK_STATUS_DONE,
  submitter: 4,
  assignee: 3
  }

];
