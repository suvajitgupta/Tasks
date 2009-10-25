/*globals CoreTasks sc_require */
sc_require('core');
sc_require('models/record_attribute');

/**
 * The base record from which all models in the CoreTasks framework will derive.
 *
 * @extends SC.Record
 * @author Suvajit Gupta
 * @author Sean Eidemiller
 */
CoreTasks.Record = SC.Record.extend({

  /**
   * The primary key for all Tasks records is the "id" attribute.
   */
  primaryKey: 'id',

  /**
   * An initial ID assigned by the client and echoed back by the server.
   *
   * This is needed so that the client is able to recognize a persisted record after it's ID has
   * been properly set by the server.
   */
  _id: SC.Record.attr(Number),

  /**
   * A displayable version of id.
   */
  displayId: function() {
    var id = this.get('id');
    if(id < 0) return '-----';
    else return '#' + id;
  }.property('id').cacheable(),

  /**
   * A one-line summary of the record.
   */
  name: SC.Record.attr(String),

  /**
   * Multi-line comments about the record.
   */
  description: SC.Record.attr(String),

  /**
   * Time at which the record was created.
   *
   * Expressed in milliseconds since the Unix Epoch.
   */
  createdAt: SC.Record.attr('CoreTasks.Date'),

  /**
   * Time at which the record was last updated.
   *
   * Expressed in milliseconds since the Unix Epoch.
   */
  updatedAt: SC.Record.attr('CoreTasks.Date')

});

// Define and register the CoreTasks.Date transformer, which converts a Javascript Number primitive
// (representing the number of milliseconds since the Unix Epoch) to an SC.DateTime object.
CoreTasks.Date = SC.beget(Object);

SC.RecordAttribute.registerTransform(CoreTasks.Date, {

  /**
   * Converts the given number of milliseconds since the Unix Epoch to an SC.DateTime object.
   */
  to: function(value) {
    if (SC.typeOf(value) === SC.T_NUMBER) value = SC.DateTime.create(value);
    return value;
  },

  /**
   * Converts the given SC.DateTime object to the number of milliseconds since the Unix Epoch.
   */
  from: function(value) {
    if (SC.instanceOf(value, SC.DateTime)) value = value.get('milliseconds');
    return value;
  }
});
