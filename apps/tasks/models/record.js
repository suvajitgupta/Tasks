// ==========================================================================
// Project:   Tasks
// Copyright: ©2009 Eloqua
// ==========================================================================
/*globals Tasks */

/** @class

  A Tasks base record

  @extends SC.Record
  @version 0.1
	@author Suvajit Gupta
*/

Tasks.Record = SC.Record.extend(
/** @scope Tasks.Record.prototype */ {

	primaryKey: 'id',
  name: SC.Record.attr(String) // for display

}) ;
