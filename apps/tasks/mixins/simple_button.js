// ==========================================================================
// Tasks.SimpleButton
// ==========================================================================

sc_require('core');

/** @class
  
  Mixin to allow for simple button actions...
  
  @author Evin Grano
  @version 0.1
  @since 0.1
*/
Tasks.SimpleButton = {
/* SimpleButton Mixin */
  target: null,
  action: null,
  hasState: NO,
  hasHover: NO,
  inState: NO,
  _hover: NO,
  stateClass: 'state',
  hoverClass: 'hover',
  
  _isMouseDown: NO, 
  
  displayProperties: ['inState'],

  /** @private 
    On mouse down, set active only if enabled.
  */    
  mouseDown: function(evt) {
    //console.log('SimpleButton#mouseDown()...');
    if (!this.get('isEnabled')) return YES ; // handled event, but do nothing
    //this.set('isActive', YES);
    this._isMouseDown = YES;
    return YES ;
  },

  /** @private
    Remove the active class on mouseOut if mouse is down.
  */  
  mouseExited: function(evt) {
    //console.log('SimpleButton#mouseExited()...');
    if ( this.get('hasHover') ){ 
      this._hover = NO; 
      this.displayDidChange();
    }
    //if (this._isMouseDown) this.set('isActive', NO);
    return YES;
  },

  /** @private
    If mouse was down and we renter the button area, set the active state again.
  */  
  mouseEntered: function(evt) {
    //console.log('SimpleButton#mouseEntered()...');
    if ( this.get('hasHover') ){ 
      this._hover = YES; 
      this.displayDidChange();
    }
    //this.set('isActive', this._isMouseDown);
    return YES;
  },

  /** @private
    ON mouse up, trigger the action only if we are enabled and the mouse was released inside of the view.
  */  
  mouseUp: function(evt) {
    //console.log('SimpleButton#mouseUp()...');
    //if (this._isMouseDown) this.set('isActive', NO); // track independently in case isEnabled has changed
    this._isMouseDown = false;
    // Trigger the action
    var target = this.get('target') || null;
    var action = this.get('action');    
    // Support inline functions
    if (this._hasLegacyActionHandler()) {
      // old school... 
      this._triggerLegacyActionHandler(evt);
    } else {
      // newer action method + optional target syntax...
      this.getPath('pane.rootResponder').sendAction(action, target, this, this.get('pane'));
    }
    if (this.get('hasState')) {
      this.set('inState', !this.get('inState'));
    }
    return YES;
  },
  
  renderMixin: function(context, firstTime){
    if (this.get('hasHover')){
      var hoverClass = this.get('hoverClass');
      context.setClass(hoverClass, this._hover); // addClass if YES, removeClass if NO
    }
    if (this.get('hasState'))
    {
      var stateClass = this.get('stateClass');
      context.setClass(stateClass, this.inState); // addClass if YES, removeClass if NO
    }
    // If there is a toolTip set, grab it and localize if necessary.
    var toolTip = this.get('toolTip') ;
    if (SC.typeOf(toolTip) === SC.T_STRING) {
      if (this.get('localize')) toolTip = toolTip.loc() ;
      context.attr('title', toolTip) ;
      context.attr('alt', toolTip) ;
    }
  },  
  
  /**
    @private
    From ButtonView 
    Support inline function definitions
   */
  _hasLegacyActionHandler: function(){
    var action = this.get('action');
    if (action && (SC.typeOf(action) == SC.T_FUNCTION)) return true;
    if (action && (SC.typeOf(action) == SC.T_STRING) && (action.indexOf('.') != -1)) return true;
    return false;
  },

  /** @private */
  _triggerLegacyActionHandler: function(evt){
    var action = this.get('action');
    if (SC.typeOf(action) == SC.T_FUNCTION) this.action(evt);
    if (SC.typeOf(action) == SC.T_STRING) {
      eval("this.action = function(e) { return "+ action +"(this, e); };");
      this.action(evt);
    }
  }
  
};
