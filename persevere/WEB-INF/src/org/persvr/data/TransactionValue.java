package org.persvr.data;

import java.util.Map;
import java.util.WeakHashMap;

/**
 * This is a value that can vary based on the thread/transaction that is accessing it 
 * @author Kris
 *
 */
public class TransactionValue implements TargetRetriever<Object> {
	Map<Transaction,Object> values = new WeakHashMap<Transaction,Object>(2);
	public Object getTarget() {
		Transaction trans = Transaction.currentTransaction();
		return values.containsKey(trans) ? values.get(trans) : values.get(Transaction.OUTSIDE);
	}
	public TransactionValue(Persistable target, String property, Object defaultValue) {
		values.put(Transaction.OUTSIDE, defaultValue);
	}
	public TransactionValue(Persistable target, String property, Object defaultValue, Object newValue) {
		values.put(Transaction.OUTSIDE, defaultValue);
		setValue(target, property, newValue);
	}
	public void setValue(Persistable target, String property, Object value) {
		Transaction currentTransaction = Transaction.currentTransaction();
		values.put(currentTransaction,value);
		Persistable schema = target.getSchema();
		Object properties = schema == null ? null : schema.get("properties");
		Object propDef;
		if (property == null || !(properties instanceof Persistable && 
				(propDef = ((Persistable) properties).get(property)) instanceof Persistable && 
				Boolean.TRUE.equals(((Persistable)propDef).get("transient"))))
			currentTransaction.changes.put(this,new Transaction.ChangeUpdate(target,property));
	}
	/**
	 * Commit the value, setting the transaction's value to be the value available to all threads by default
	 * @return if the transaction value can be replaced with a normal value (no other transactions are using this slot)
	 */
	public boolean commit(Transaction trans) {
		if (values.containsKey(trans))
			values.put(Transaction.OUTSIDE, values.remove(trans));
		return values.size() <= 1;
	}
	public void abort(Transaction trans){
		values.remove(trans);
	}
}
