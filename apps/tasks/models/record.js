// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks sc_require */

/** @class

  A base record for Tasks

  @extends SC.Record
  @version 0.1
*/
Tasks.Record = SC.Record.extend(
/** @scope Tasks.Record.prototype */ {

	primaryKey: 'id',
  name: SC.Record.attr(String) // for display

}) ;
