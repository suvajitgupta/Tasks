Class({
  id: "user",
  properties: {
    _id: { type: "any", optional: true },
    name: { type: "any", optional: false },
    loginName: { type: "any", optional: false },
    role: { type: "any", optional: false },
    preferences: { type: "object", optional: true },
    authToken: { type: "any", optional: true }
  }
});
