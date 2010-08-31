Class({
  id: "all",

  get: function() {
    return { users: load('user'), projects: load('project'), tasks: load('task'), watches: load('watch') }
  },

  getDelta: function(timestamp) {
    var query = 'updatedAt!=null & updatedAt!=undefined & updatedAt>$1';
    return {
      users: load('user?' + query, timestamp),
      projects: load('project?' + query, timestamp),
      tasks: load('task?' + query, timestamp),
      watches: load('watch?' + query, timestamp)
    }
  }
});
