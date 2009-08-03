Class({
  id: "user",
  properties: {
    name: { type: "string", optional: false },
    loginName: { type: "string", optional: false },
    role: { type: "string", optional: false, enum: ["Manager", "Developer", "Tester"] },
    preferences: { type: "object", optional: true },
    authToken: { type: "string", optional: true }
  }
});
