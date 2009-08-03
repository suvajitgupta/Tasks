Class({
  id: "task",
  properties: {
    name: { type: "string", optional: false },
    description: { type: "string", optional: true },
    type: { type: "string", optional: false },
    priority: { type: "string", optional: false },
    status: { type: "string", optional: false, },
    validation: { type: "string", optional: false, },
    effort: { type: "any", optional: true },
    submitter: { optional: true },
    assignee: { optional: true }
  }
});
