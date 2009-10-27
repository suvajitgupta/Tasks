Class({
  id: "task",
  properties: {
    _id: { type: "any", optional: true },
    createdAt: { type: "any", optional: true },
    updatedAt: { type: "any", optional: true },
    name: { type: "any", optional: false },
    description: { type: "any", optional: true },
    projectId: { type: "any", optional: true },
    priority: { type: "any", optional: true },
    effort: { type: "any", optional: true },
    submitterId: { type: "any", optional: true },
    assigneeId: { type: "any", optional: true },
    type: { type: "any", optional: true },
    developmentStatus: { type: "any", optional: true, },
    validation: { type: "any", optional: true, }
  }
});
