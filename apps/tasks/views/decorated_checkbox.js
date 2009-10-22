//============================================================================
// Tasks.DecoratedCheckboxView
//============================================================================
/*globals Tasks sc_static sc_require*/
sc_require('core');

/**

  Subclass of CheckBoxView with icons
  
  @extends SC.CheckboxView
  @author Suvajit Gupta
  @author Josh Holt [JH2]
  @version preBeta
  @since preBeta

*/

Tasks.DecoratedCheckboxView = SC.CheckboxView.extend({
  
  icon: '',
  
  render: function(context, firstTime) {
    var dt, elem ;
    
    // add checkbox -- set name to view guid to separate it from others
    if (firstTime) {
      dt = this._field_currentDisplayTitle = this.get('displayTitle');

      var blank = sc_static('blank');
      var icon = this.get('icon');
      var disabled = this.get('isEnabled') ? '' : 'disabled="disabled"';
      context.push('<span class="button" ></span>');
      context.push('<input type="checkbox" name="%@" %@ />'.fmt(SC.guidFor(this),disabled));
      if (icon !== '' && !SC.none(icon)) {
       context.push('<img src="', blank, '" class="icon %@" />'.fmt(icon));
      }
      context.push('<span class="label">', dt, '</span>');
      context.attr('name', SC.guidFor(this));

    // since we don't want to regenerate the contents each time 
    // actually search for and update the displayTitle.
    } else {
      
      if (elem = this.$input()[0]) {
        if (this.get('isEnabled')) elem.disabled=NO;
        else elem.disabled=YES;
        elem = null; // avoid memory leaks
      }
      
      dt = this.get('displayTitle');
      if (dt !== this._field_currentDisplayTitle) {
        this._field_currentDisplayTitle = dt;
        this.$('span.label').text(dt);
      }
    }
  }
    
});