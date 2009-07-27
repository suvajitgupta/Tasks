/*globals CoreTasks sc_require */
sc_require('core');
sc_require('models/record_attribute');

/**
 * The base record from which all models in the CoreTasks framework will derive.
 *
 * @extends SC.Record
 * @author Suvajit Gupta
 */
CoreTasks.Record = SC.Record.extend({

  /**
   * The primary key for all Tasks records is the "id" attribute.
   */
  primaryKey: 'id'

});
