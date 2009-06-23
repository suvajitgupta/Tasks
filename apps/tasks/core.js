// ==========================================================================
// Project:   Tasks
// ==========================================================================
/*globals Tasks */

/** @namespace

  "Tasks" - an agile project management tool
  
  @extends SC.Object
  @author Suvajit Gupta
*/
Tasks = SC.Object.create(
  /** @scope Tasks.prototype */ {

  consts: {},
  NAMESPACE: 'Tasks',
  VERSION: '0.1',

  // This is your application store.  You will use this store to access all
  // of your model data.  You can also set a data source on this store to
  // connect to a backend server.  The default setup below connects the store
  // to any fixtures you define.
  store: SC.Store.create().from(SC.Record.fixtures)
  
});
