Class({
  id: "all",

  get: function() {
    return { users: load('user'), projects: load('project'), tasks: load('task'), watches: load('watch') }
  },

  getDelta: function(timestamp) {
    var query = 'updatedAt>$1 | createdAt>$1 | (createdAt=null & updatedAt=null) | (createdAt=undefined & updatedAt=undefined)';

    return {
      users: load('user?' + query, timestamp),
      projects: load('project?' + query, timestamp),
      tasks: load('task?' + query, timestamp),
      watches: load('watch?' + query, timestamp)
    }
  }
});
