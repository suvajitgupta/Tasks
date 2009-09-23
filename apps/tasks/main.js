/*globals Tasks CoreTasks */

/**
 * The main program - start off in first state.
 */

function main() { Tasks.main(); }

Tasks.main = function main() {

  console.log("\"Tasks\" started at: %@".fmt(new Date()));
  
  // TODO: [SG] branch on Tasks "mode" (single-user/local, multi-user/Tasks server or other server)
  Tasks.goState('a', 1);

};