/*globals Tasks */
Tasks.main = function main() {

  console.log("Tasks started at: %@".fmt(new Date()));
  
  // Enter the statechart.
  // TODO: branch on Tasks "mode" (single-user/local, multi-user/Tasks server or other server)
  Tasks.goState('a', 1);

};

function main() { Tasks.main(); }
