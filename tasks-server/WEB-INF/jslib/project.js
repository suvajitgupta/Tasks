Class({
  id: "project",
  properties: {
    name: { type: "string", optional: false },
    timeLeft: { type: "any", optional: true },
    tasks: { type: "array", optional: true }
  }
});
