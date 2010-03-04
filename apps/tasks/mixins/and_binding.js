/** 

  One-way binding that acts like an 'AND' gate, returning the
  logical AND of two values located at 'pathA' and 'pathB'.
  
	@author Jonathan Lewis
*/

SC.Binding.and = function(pathA, pathB) {
 var gate = SC.Object.create({
   valueABinding: SC.Binding.oneWay(pathA),
   valueBBinding: SC.Binding.oneWay(pathB),

   and: function() {
     return (this.get('valueA') && this.get('valueB')) ? YES : NO;
   }.property('valueA', 'valueB').cacheable()
 });

 return this.from('and', gate).oneWay();
};