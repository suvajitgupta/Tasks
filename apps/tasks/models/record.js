/*globals Tasks sc_require */
sc_require('core');
sc_require('models/record_attribute');

/**
 * The base record from which all models in the Tasks framework will derive.
 *
 * @extends SC.Record
 * @author Suvajit Gupta
 */
Tasks.Record = SC.Record.extend({

  /**
   * The primary key for all Tasks records is the "id" attribute.
   */
  primaryKey: 'id'

});
