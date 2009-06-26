/**
 * An extension of the SC.RecordAttribute class that provides validation against a defined list of
 * allowed values.
 *
 * FIXME: [SE] It doesn't appear as though the call method is being invoked.
 *
 * @extends SC.RecordAttribute
 * @author Sean Eidemiller
 */
/*globals Tasks sc_require */

sc_require('core');

Tasks.RecordAttribute = SC.RecordAttribute.extend({

  /**
   * An array of allowed values.
   *
   * If empty, any value is allowed.
   * 
   * @property {Array}
   */
  allowed: [],

  /**
   * Overrides call() in SC.RecordAttribute to provide validation using the allowedValues array.
   */
  call: function(record, key, value) {
    var attrKey = this.get('key') || key;
    
    if (value !== undefined) {
      value = this.fromType(record, key, value);

      if (this.allowed.length > 0 && this.allowed.indexOf(value) === -1) {
        throw "Value not allowed for '%@' attribute: %@".fmt(key, value);
      }

      record.writeAttribute(attrKey, value);
      return value;

    } else {
      return sc_super();
    }
  }
});

// Override the attr() function on SC.Record to return to our own implementation of the
// RecordAttribute class.
SC.Record.attr = function(type, opts) {
  return Tasks.RecordAttribute.attr(type, opts);
};
