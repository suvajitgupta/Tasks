Class({
  id: "project",
  properties: {
    _id: { type: "any", optional: true },
    createdAt: { type: "any", optional: true },
    updatedAt: { type: "any", optional: true },
    name: { type: "any", optional: false },
    description: { type: "any", optional: true },
    timeLeft: { type: "any", optional: true }
  }
});
