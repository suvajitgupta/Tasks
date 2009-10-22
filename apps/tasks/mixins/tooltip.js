// FIXME: [SG] delete this file once SCUI is open sourced

/**
 * A render mixin that adds tooltip attributes to the layer DOM.
 *
 * @author Michael Harris
 * @since FR3
 */
/*globals Tasks sc_require */
sc_require('core');

Tasks.ToolTip = {

  toolTip: '',

  renderMixin: function(context, firstTime){

    var toolTip = this.get('toolTip');

    var attr = {
      title: toolTip,
      alt: toolTip
    };

    context = context.attr(attr);
  }
};

