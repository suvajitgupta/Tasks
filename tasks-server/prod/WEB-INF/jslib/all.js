/*globals Class load */
Class({
  id: "all",

  get: function() {
    var query = 'status!="deleted"';
    return {
      users: load('user?' + query),
      projects: load('project?' + query),
      tasks: load('task?' + query),
      watches: load('watch?' + query),
      comments: load('comment?' + query)
    };
  },

  getDelta: function(timestamp) {
    var query = 'updatedAt!=null & updatedAt!=undefined & updatedAt>$1';
    return {
      users: load('user?' + query, timestamp),
      projects: load('project?' + query, timestamp),
      tasks: load('task?' + query, timestamp),
      watches: load('watch?' + query, timestamp),
      comments: load('comment?' + query, timestamp)
    };
  },
  
  // Delete soft-deleted items and handle IDs referencing non-existent records
  // Example command line invocation that cleans up more than month-old soft-deleted data (default):
  //   curl -X POST http://localhost:4400/tasks-server/Class/all -d "{ method: 'cleanup', id: 'records', params: [] }"
  // To cleanup soft-deleted data older than a certain 'cutoff', specify: params: [<timestamp>]
  // If <timestamp> is set to 0, all soft-deleted records will be deleted
  cleanup: function(timestamp) {
    
    var now = Date.now();
    
    // Delete soft-deleted records older than timestamp (if specified) or older than a month
    var cutoff;
    if(timestamp === undefined) cutoff = now - 30*24*60*60*1000;
    else cutoff = timestamp;
    
    var query = 'status="deleted"';
    if(cutoff > 0) query += ' & updatedAt<$1';
    
    var len, i;
    var usersToDelete = load('user?' + query, cutoff);
    for (i = 0, len = usersToDelete.length; i < len; i++) remove(usersToDelete[i]);
    var projectsToDelete = load('project?' + query, cutoff);
    for (i = 0, len = projectsToDelete.length; i < len; i++) remove(projectsToDelete[i]);
    var tasksToDelete = load('task?' + query, cutoff);
    for (i = 0, len = tasksToDelete.length; i < len; i++) remove(tasksToDelete[i]);
    var watchesToDelete = load('watch?' + query, cutoff);
    for (i = 0, len = watchesToDelete.length; i < len; i++) remove(watchesToDelete[i]);
    var commentsToDelete = load('comment?' + query, cutoff);
    for (i = 0, len = commentsToDelete.length; i < len; i++) remove(commentsToDelete[i]);
    
    // Handle IDs referencing non-existent records:
    // * non-existent task projectId/submitterId/assigneeId should be set to null
    // * watches/comments with non-existent taskId/userId should be soft-deleted
    // * set updatedAt for all records being modified
    var idExtractor = function(record) { var id = (record.status == 'deleted')? '' : record.id; return id.replace(/^.*\//, "") * 1; };
    var users = load("user/"), userIds = users.map(idExtractor);
    var projects = load("project/"), projectIds = projects.map(idExtractor);
    var tasks = load("task/"), taskIds = tasks.map(idExtractor);
    var task, tasksUpdated = [];
    for (i = 0, len = tasks.length; i < len; i++) {
      var updated = false;
      task = tasks[i];
      if(task.status === 'deleted') continue;
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
    var comments = load('comment/'), comment, commentsSoftDeleted = [];
    for (i = 0, len = comments.length; i < len; i++) {
      comment = comments[i];
      if(comment.status === 'deleted') continue;
      if(taskIds.indexOf(comment.taskId) === -1 || userIds.indexOf(comment.userId) === -1) {
        comment.status = 'deleted';
        comment.updatedAt = now;
        commentsSoftDeleted.push(comment);
      }
    }
    
    // Return all affected records broken down by category
    return {
      cutoff: cutoff,
      usersDeleted: usersToDelete,
      projectsDeleted: projectsToDelete,
      tasksDeleted: tasksToDelete,
      watchesDeleted: watchesToDelete,
      commentsDeleted: commentsToDelete,
      tasksUpdated: tasksUpdated,
      watchesSoftDeleted: watchesSoftDeleted,
      commentsSoftDeleted: commentsSoftDeleted
    };
    
  }
  
});
