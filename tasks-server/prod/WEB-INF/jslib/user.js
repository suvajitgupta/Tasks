Class({
  id: "user",
  properties: {
    _id: { type: "any", optional: true },
    createdAt: { type: "any", optional: true },
    updatedAt: { type: "any", optional: true },
    name: { type: "any", optional: false },
    loginName: { type: "any", optional: false },
    role: { type: "any", optional: false },
    email: { type: "any", optional: true },
    password: { type: "any", optional: true },
    preferences: { type: "object", optional: true },
    authToken: { type: "any", optional: true }
  }
});
