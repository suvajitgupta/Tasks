// ========================================================================
// Copyright 2008 Erich Atlas Ocean.
//
// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in 
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
// DEALINGS IN THE SOFTWARE.
//
// ========================================================================

// TODO: [SC] move this code into SproutCore framework

/**
  @namespace
  
  SC.Statechart is a mixin that implements a simplified statechart architecture.
  Usually, you'll apply this to your application's core object:
  
  {{{
    MyApp = SC.Object.create(SC.Statechart, {
      // SC.Statechart properies and methods are now available...
      
      someAction: function() {
        var handled = NO; // optional, not required for statechart semantics, but good to know :)
        
        switch ( this.state.a ) {
          case 1:
            this.goState('a', 2); // update state and stateHistory properties, then: this.goStateA2();
            handled = YES;
            break;
          case 2:
            this.goState('a', 1); // update state and stateHistory properties, then: this.goStateA1();
            handled = YES;
            break;
        }
        
        if (!handled) alert( 'MyApp#someAction was not handle in state %@[%@]'.fmt('a', this.state.a) );
      },
      
      goStateA1: function() { alert('in state A[1]'); },
      goStateA2: function() { alert('in state A[2]'); }
      
    });
  }}}
  
  In your main.js file's main() function, set the start state:
  
  {{{
    function main() {
      SC.page.awake(); // need to set up views before calling goState method
      MyApp.goState('a', 1); // enter the start state
    } ;
  }}}
  
  You can easily access history states, which are automatically maintained by the SC.Statechart mixin:
  
  {{{
    switch ( this.state.history.a ) {
      case 1:
        console.log("the history value for state 'a' is 1");
        break;
    }
  }}}
  
  To put up a JavaScript alert each time your statechart changes, do:
  
  {{{
    this.state.alert = YES;
  }}}
  
  Similarly, you can receive a log in the console each time your statechart changes:
  
  {{{
    this.state.log = YES;
  }}}
  
  Simply set the properties to NO when you don't want to be alerted or see logs anymore.
  
  To see all of your defined state and state.history values in a JavaScript alert, do:
  
  {{{
    this.state.show();
  }}}
  
  @author Erich Atlas Ocean
  @version 1.0
*/
SC.Statechart = {
  
  /** @private */
  initMixin: function() {
    // each object has its own state...
    this.state = SC.Object.create({
      log: NO,
      alert: NO,
      history: SC.Object.create({}),
      
      show: function() {
        var regex = /^[a-z]$/;
        var result = 'States:\n\n';
        
        for (var key in this) {
          if ( key.match(regex) ) result = result + key + this[key] + ': ' + '\n';
        }
        
        result += '\n\nHistory:\n\n';
        
        for (var key in this.history) {
          if ( key.match(regex) ) result = result + key + this.history[key] + ': ' + '\n';
        }
        
        alert(result);
      },
      
      propertyObserver: function(observer,target,key,value) {
        if (this.alert) alert('Entering state %@[%@]'.fmt(key,value));
        if (this.log) console.log('Entering state %@[%@]'.fmt(key,value));
      }
    });
  },
  
  /**
    @field {SC.Object} the state values for this object
  */
  state: null, // overridden in initMixin
  
  /**
    This is the method to use to changes states:<br>
    
    <code><pre>
      this.goState('b', 4); // transition to state B[4] and call this.goStateB4()
    </pre></code>
    
    If you need to give animation an opportunity to run, you can set delay to YES:<br>
    
    <code><pre>
      this.goState('m', 6, YES); // transitions to state M[6] on the next run loop
    </pre></code>
    
    @param {String} stateVar The state variable you want to go to, e.g. *'a'*
    @param {Integer} index The state index you want to go to, e.g. *1*
    @param {Boolean} delay Pass NO or undefined to enter the state immediately, YES to enter the state the next run loop
  */
  goState: function(stateVar,index,delay) {
    var func = this['goState%@%@'.fmt(stateVar.toUpperCase(),index)];
    
    if (func === undefined) {
      alert('The goState%@%@ function is undefined.'.fmt(stateVar.toUpperCase(),index));
    }
    else if (SC.typeOf(func) !== SC.T_FUNCTION) {
      alert('The goState%@%@ property is not a function: %@.'.fmt(stateVar.toUpperCase(),index, func));
    }
    else {
      if (delay) { // call this.func() on the next run loop to give animation an opportunity to run
        var that = this;
        var ignored  = function() {
          that.state.set(stateVar, index);
          that.state.history.set(stateVar, index);
          func.call(that);
        }.invokeLater();
      }
      else {
        this.state.set(stateVar, index);
        this.state.history.set(stateVar, index);
        func.call(this);
      }
    }
  }
  
} ;