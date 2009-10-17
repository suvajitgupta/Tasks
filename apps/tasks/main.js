/*globals Tasks CoreTasks */

/**
 * The main program - start off in first state.
 */

function main() { Tasks.main(); }

Tasks.main = function main() {

  console.log("\"Tasks\" started at: %@".fmt(new Date()));
  
  Tasks.goState('a', 1);

};