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
			"instances":{"$ref":"../user/"}
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
		"name":"watch",
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
				"taskId":{
					"type":"any",
					"optional":true
				},
				"userId":{
					"type":"any",
					"optional":true
				}
			},
			"prototype":{
			},
			"instances":{"$ref":"../watch/"}
		}
	},
	{"id":"generated.js?sources?4",
		"name":"all",
		"schema":{
			"prototype":{
				"get":function () {
    return serialize(load("user"));
}
			},
			"instances":{"$ref":"../all/"},
			"get":
function (loadDoneProjectData) {
    var query = "status!=\"deleted\"";
    var projects = load("project?" + query);
    var tasks = load("task?" + query);
    var watches = load("watch?" + query);
    var comments = load("comment?" + query);
    var notDoneProjects = [], doneProjectIds = [], tasksInNotDoneProjects = [], tasksInDoneProjectIds = [], watchesOnTasksInNotDoneProjects = [], commentsOnTasksInNotDoneProjects = [];
    if (!loadDoneProjectData) {
        var len, i, project, task, watch, comment;
        for (i = 0, len = projects.length; i < len; i++) {
            project = projects[i];
            if (project.developmentStatus === "_Done") {
                doneProjectIds.push(this.extractId(project.id));
            } else {
                notDoneProjects.push(project);
            }
        }
        for (i = 0, len = tasks.length; i < len; i++) {
            task = tasks[i];
            if (doneProjectIds.indexOf(task.projectId) === -1) {
                tasksInNotDoneProjects.push(task);
            } else {
                tasksInDoneProjectIds.push(this.extractId(task.id));
            }
        }
        for (i = 0, len = watches.length; i < len; i++) {
            watch = watches[i];
            if (tasksInDoneProjectIds.indexOf(watch.taskId) === -1) {
                watchesOnTasksInNotDoneProjects.push(watch);
            }
        }
        for (i = 0, len = comments.length; i < len; i++) {
            comment = comments[i];
            if (tasksInDoneProjectIds.indexOf(comment.taskId) === -1) {
                commentsOnTasksInNotDoneProjects.push(comment);
            }
        }
    }
    return {users:load("user?" + query), projects:loadDoneProjectData ? projects : notDoneProjects, tasks:loadDoneProjectData ? tasks : tasksInNotDoneProjects, watches:loadDoneProjectData ? watches : watchesOnTasksInNotDoneProjects, comments:loadDoneProjectData ? comments : commentsOnTasksInNotDoneProjects};
}
,
			"getDelta":
function (timestamp) {
    var query = "updatedAt!=null & updatedAt!=undefined & updatedAt>$1";
    return {users:load("user?" + query, timestamp), projects:load("project?" + query, timestamp), tasks:load("task?" + query, timestamp), watches:load("watch?" + query, timestamp), comments:load("comment?" + query, timestamp)};
}
,
			"cleanup":
function (timestamp) {
    var now = Date.now();
    var cutoff;
    if (timestamp === undefined) {
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
    } else {
        cutoff = timestamp;
    }
    var query = "status=\"deleted\"";
    if (cutoff > 0) {
        query += " & updatedAt<$1";
    }
    var len, i;
    var usersToDelete = load("user?" + query, cutoff);
    for (i = 0, len = usersToDelete.length; i < len; i++) {
        remove(usersToDelete[i]);
    }
    var projectsToDelete = load("project?" + query, cutoff);
    for (i = 0, len = projectsToDelete.length; i < len; i++) {
        remove(projectsToDelete[i]);
    }
    var tasksToDelete = load("task?" + query, cutoff);
    for (i = 0, len = tasksToDelete.length; i < len; i++) {
        remove(tasksToDelete[i]);
    }
    var watchesToDelete = load("watch?" + query, cutoff);
    for (i = 0, len = watchesToDelete.length; i < len; i++) {
        remove(watchesToDelete[i]);
    }
    var commentsToDelete = load("comment?" + query, cutoff);
    for (i = 0, len = commentsToDelete.length; i < len; i++) {
        remove(commentsToDelete[i]);
    }
    var idExtractor = function (record) {
        var id = (record.status == "deleted") ? "" : record.id;
        return this.extractId(id);
    };
    var users = load("user/"), userIds = users.map(idExtractor);
    var projects = load("project/"), projectIds = projects.map(idExtractor);
    var tasks = load("task/"), taskIds = tasks.map(idExtractor);
    var task, tasksUpdated = [];
    for (i = 0, len = tasks.length; i < len; i++) {
        var updated = false;
        task = tasks[i];
        if (task.status === "deleted") {
            continue;
        }
        var projectId = task.projectId;
        if (projectId && projectIds.indexOf(projectId) === -1) {
            task.projectId = undefined;
            updated = true;
        }
        var submitterId = task.submitterId;
        if (submitterId && userIds.indexOf(submitterId) === -1) {
            task.submitterId = undefined;
            updated = true;
        }
        var assigneeId = task.assigneeId;
        if (assigneeId && userIds.indexOf(assigneeId) === -1) {
            task.assigneeId = undefined;
            updated = true;
        }
        if (updated) {
            task.updatedAt = now;
            tasksUpdated.push(task);
        }
    }
    var watches = load("watch/"), watch, watchesSoftDeleted = [];
    for (i = 0, len = watches.length; i < len; i++) {
        watch = watches[i];
        if (watch.status === "deleted") {
            continue;
        }
        if (taskIds.indexOf(watch.taskId) === -1 || userIds.indexOf(watch.userId) === -1) {
            watch.status = "deleted";
            watch.updatedAt = now;
            watchesSoftDeleted.push(watch);
        }
    }
    var comments = load("comment/"), comment, commentsSoftDeleted = [];
    for (i = 0, len = comments.length; i < len; i++) {
        comment = comments[i];
        if (comment.status === "deleted") {
            continue;
        }
        if (taskIds.indexOf(comment.taskId) === -1 || userIds.indexOf(comment.userId) === -1) {
            comment.status = "deleted";
            comment.updatedAt = now;
            commentsSoftDeleted.push(comment);
        }
    }
    return {cutoff:cutoff, usersDeleted:usersToDelete, projectsDeleted:projectsToDelete, tasksDeleted:tasksToDelete, watchesDeleted:watchesToDelete, commentsDeleted:commentsToDelete, tasksUpdated:tasksUpdated, watchesSoftDeleted:watchesSoftDeleted, commentsSoftDeleted:commentsSoftDeleted};
}
,
			"extractId":
function (idString) {
    return idString.replace(/^.*\//, "") * 1;
}

		}
	}
]
}