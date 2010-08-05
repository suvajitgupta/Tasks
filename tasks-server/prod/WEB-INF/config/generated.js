{"id":"generated.js",
"sources":[
	{"id":"generated.js?sources?0",
		"name":"user",
		"schema":{
			"properties":{
				"_id":{
					"type":"any",
					"optional":true
				},
				"createdAt":{
					"type":"any",
					"optional":true
				},
				"updatedAt":{
					"type":"any",
					"optional":true
				},
				"name":{
					"type":"any",
					"optional":false
				},
				"loginName":{
					"type":"any",
					"optional":false
				},
				"role":{
					"type":"any",
					"optional":false
				},
				"email":{
					"type":"any",
					"optional":true
				},
				"password":{
					"type":"any",
					"optional":true
				},
				"preferences":{
					"type":"object",
					"optional":true
				},
				"authToken":{
					"type":"any",
					"optional":true
				}
			},
			"prototype":{
			},
			"instances":{"$ref":"../user/"},
			"authenticate":
function (username, password) {
    if (username === null) {
        return null;
    }
    var error = "null";
    var successful = false;
    var user = load("user/[?loginName=$1]", username)[0];
    if (user) {
        if (user.password === password || user.password === null) {
            successful = true;
        } else {
            error = "(" + user.password + ")";
        }
    } else {
        error = " User " + username + " Found";
    }
    if (!successful) {
        throw new AccessError("Authentication failed  " + error);
    }
    return load("user/[?loginName=$1]", username)[0];
}

		}
	},
	{"id":"generated.js?sources?1",
		"name":"project",
		"schema":{
			"properties":{
				"_id":{
					"type":"any",
					"optional":true
				},
				"createdAt":{
					"type":"any",
					"optional":true
				},
				"updatedAt":{
					"type":"any",
					"optional":true
				},
				"name":{
					"type":"any",
					"optional":false
				},
				"description":{
					"type":"any",
					"optional":true
				},
				"timeLeft":{
					"type":"any",
					"optional":true
				},
				"developmentStatus":{
					"type":"any",
					"optional":true
				},
				"activatedAt":{
					"type":"any",
					"optional":true
				}
			},
			"prototype":{
			},
			"instances":{"$ref":"../project/"}
		}
	},
	{"id":"generated.js?sources?2",
		"name":"task",
		"schema":{
			"properties":{
				"_id":{
					"type":"any",
					"optional":true
				},
				"createdAt":{
					"type":"any",
					"optional":true
				},
				"updatedAt":{
					"type":"any",
					"optional":true
				},
				"name":{
					"type":"any",
					"optional":false
				},
				"description":{
					"type":"any",
					"optional":true
				},
				"projectId":{
					"type":"any",
					"optional":true
				},
				"priority":{
					"type":"any",
					"optional":true
				},
				"effort":{
					"type":"any",
					"optional":true
				},
				"submitterId":{
					"type":"any",
					"optional":true
				},
				"assigneeId":{
					"type":"any",
					"optional":true
				},
				"type":{
					"type":"any",
					"optional":true
				},
				"developmentStatus":{
					"type":"any",
					"optional":true
				},
				"validation":{
					"type":"any",
					"optional":true
				}
			},
			"prototype":{
			},
			"instances":{"$ref":"../task/"}
		}
	},
	{"id":"generated.js?sources?3",
		"name":"all",
		"schema":{
			"prototype":{
				"get":function () {
    return serialize(load("user"));
}
			},
			"instances":{"$ref":"../all/"},
			"get":
function () {
    return {users:load("user"), projects:load("project"), tasks:load("task")};
}

		}
	}
]
}