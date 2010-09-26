/*globals Class load */
Class({
  id: "all",

  get: function() {
    return { users: load('user'), projects: load('project'), tasks: load('task'), watches: load('watch') };
  },

  getDelta: function(timestamp) {
    var query = 'updatedAt!=null & updatedAt!=undefined & updatedAt>$1';
    return {
      users: load('user?' + query, timestamp),
      projects: load('project?' + query, timestamp),
      tasks: load('task?' + query, timestamp),
      watches: load('watch?' + query, timestamp)
    };
  },
  
  // Example command line invocations:
  // curl -X POST http://localhost:8088/tasks-server/Class/all -d "{ method: 'cleanup', id: 'records', params: [] }"
  // curl -X POST http://localhost:8088/tasks-server/Class/all -d "{ method: 'cleanup', id: 'records', params: [1282279058109] }"
  cleanup: function(timestamp) {
    
    var now = Date.now();
    
    // Delete soft-deleted records older than timestamp (if specified) or older than a month
    var cutoff = timestamp !== undefined? timestamp : now - 30*24*60*60*1000;
    var query = 'status="deleted" & updatedAt<$1';
    var len, i;
    var usersToDelete = load('user?' + query, cutoff);
    for (i = 0, len = usersToDelete.length; i < len; i++) remove(usersToDelete[i]);
    var projectsToDelete = load('project?' + query, cutoff);
    for (i = 0, len = projectsToDelete.length; i < len; i++) remove(projectsToDelete[i]);
    var tasksToDelete = load('task?' + query, cutoff);
    for (i = 0, len = tasksToDelete.length; i < len; i++) remove(tasksToDelete[i]);
    var watchesToDelete = load('watch?' + query, cutoff);
    for (i = 0, len = watchesToDelete.length; i < len; i++) remove(watchesToDelete[i]);
    
    // Handle IDs referencing non-existent records:
    // * non-existent task projectId/submitterId/assigneeId should be set to null
    // * watches with non-existent taskId/watchId should be soft-deleted
    // * set updatedAt for all records being modified
    var idExtractor = function(record) { var id = (record.status == 'deleted')? '' : record.id; return id.replace(/^.*\//, "") * 1; };
    var users = load("user/"), userIds = users.map(idExtractor);
    var projects = load("project/"), projectIds = projects.map(idExtractor);
    var tasks = load("task/"), taskIds = tasks.map(idExtractor);
    var task, tasksUpdated = [];
    for (i = 0, len = tasks.length; i < len; i++) {
      var updated = false;
      task = tasks[i];
      var projectId = task.projectId;
      if(projectId && projectIds.indexOf(projectId) === -1) {
        task.projectId = undefined;
        updated = true;
      }
      var submitterId = task.submitterId;
      if(submitterId && userIds.indexOf(submitterId) === -1) {
        task.submitterId = undefined;
        updated = true;
      }
      var assigneeId = task.assigneeId;
      if(assigneeId && userIds.indexOf(assigneeId) === -1) {
        task.assigneeId = undefined;
        updated = true;
      }
      if(updated) {
        task.updatedAt = now;
        tasksUpdated.push(task);
      }
    }
    var watches = load('watch/'), watch, watchesSoftDeleted = [];
    for (i = 0, len = watches.length; i < len; i++) {
      watch = watches[i];
      if(watch.status === 'deleted') continue;
      if(taskIds.indexOf(watch.taskId) === -1 || userIds.indexOf(watch.userId) === -1) {
        watch.status = 'deleted';
        watch.updatedAt = now;
        watchesSoftDeleted.push(watch);
      }
    }
    
    // Return all affected records broken down by category
    return {
      cutoff: cutoff,
      usersDeleted: usersToDelete,
      projectsDeleted: projectsToDelete,
      tasksDeleted: tasksToDelete,
      watchesDeleted: watchesToDelete,
      tasksUpdated: tasksUpdated,
      watchesSoftDeleted: watchesSoftDeleted
    };
    
  }
  
});
