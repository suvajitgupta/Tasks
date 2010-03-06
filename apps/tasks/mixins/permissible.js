/*globals Tasks */

/** 

  A mixin to render unauthorized items differently (e.g., change background color or draw a lock icon).
  This is used to differentiate items that are disabled owing to permission issues).
  
  A user of this mixin must set the binding to the 'isPermitted' property.
  When 'isPermitted' is false, the class 'unauthorized' is added.
  
	@author Suvajit Gupta
*/
Tasks.Permissible = {
  
  isPermitted: null,
  displayProperties: ['isPermitted'],
  
  /**
    @optional
    What to append to the tooltip when unauthorized
  */
  tooltipSuffix: " (unauthorized)".loc(),
  
  _isPermittedDidChange: function() {
    if(this.get('isPermitted')) {
      if(!SC.none(this._tooltip)) this.setIfChanged('toolTip', this._tooltip);
    }
    else {
      this._tooltip = this.get('toolTip');
      this.set('toolTip', this._tooltip + this.get('tooltipSuffix'));
    }
  }.observes('isPermitted'),

  renderMixin: function(context, firstTime) {
    context.setClass('unauthorized', !this.get('isPermitted'));
  }
  
};

/**
  Adds a transform that forwards the logical 'AND' of values at 'pathA' and
  'pathB' whenever either source changes.  Note that the transform acts strictly
  as a one-way binding, working only in the direction
  
    'pathA' AND 'pathB' --> value  (value will be either YES or NO)

  Usage example where a delete button's 'isEnabled' value is determined by whether
  something is selected in a list and whether the current user is allowed to delete:
  
    deleteButton: SC.ButtonView.design({
      isEnabledBinding: SC.Binding.logicalAnd('MyApp.itemsController.hasSelection', 'MyApp.userController.canDelete')
    })

*/
SC.Binding.logicalAnd = function(pathA, pathB) {

  // create an object to do the logical computation
  var gate = SC.Object.create({
    valueABinding: pathA,
    valueBBinding: pathB,

    and: function() {
      return (this.get('valueA') && this.get('valueB')) ? YES : NO;
    }.property('valueA', 'valueB').cacheable()
  });

  // add a transform that depends on the result of that computation.
  return this.from('and', gate).oneWay();
};