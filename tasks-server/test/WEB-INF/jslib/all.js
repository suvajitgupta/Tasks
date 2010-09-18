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
  
  cleanup: function(timestamp) {
    var monthAgo = Date.now() - 30*24*60*60*1000;
    var query = 'status="deleted" & updatedAt<$1';
    var len, i;
    var users_to_delete = load('user?' + query, monthAgo);
    for (i = 0, len = users_to_delete.length; i < len; i++) remove(users_to_delete[i]);
    var projects_to_delete = load('project?' + query, monthAgo);
    for (i = 0, len = projects_to_delete.length; i < len; i++) remove(projects_to_delete[i]);
    var tasks_to_delete = load('task?' + query, monthAgo);
    for (i = 0, len = tasks_to_delete.length; i < len; i++) remove(tasks_to_delete[i]);
    var watches_to_delete = load('watch?' + query, monthAgo);
    for (i = 0, len = watches_to_delete.length; i < len; i++) remove(watches_to_delete[i]);
    return {
      users: users_to_delete,
      projects: projects_to_delete,
      tasks: tasks_to_delete,
      watches: watches_to_delete
    };
  }
  
});
