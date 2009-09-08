Class({
  id: "user",
  properties: {
    name: { type: "any", optional: false },
    loginName: { type: "any", optional: false },
    role: { type: "any", optional: false, enum: ["Manager", "Developer", "Tester"] },
    preferences: { type: "object", optional: true },
    authToken: { type: "any", optional: true }
  }
});
