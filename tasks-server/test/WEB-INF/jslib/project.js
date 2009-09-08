Class({
  id: "project",
  properties: {
    name: { type: "any", optional: false },
    timeLeft: { type: "any", optional: true },
    tasks: { type: "array", optional: true }
  }
});
