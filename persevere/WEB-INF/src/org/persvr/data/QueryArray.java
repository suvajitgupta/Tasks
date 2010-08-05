package org.persvr.data;

import java.util.AbstractList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.ListIterator;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.Map.Entry;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.JavaScriptException;
import org.mozilla.javascript.NativeIterator;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.security.PermissionLevel;

public class QueryArray extends PersistableObject implements List, QueryCollection, Persistable {
	public void add(int index, Object element) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean add(Object e) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean addAll(Collection c) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean addAll(int index, Collection c) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public void clear() {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean contains(Object o) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public boolean containsAll(Collection c) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public QueryArray(Collection sourceCollection){
		this.sourceCollection = sourceCollection;
		ScriptRuntime.setObjectProtoAndParent(this, GlobalData.getGlobalScope());
	}
	//TODO: We may want to make a weakhashmap or threadlocal to store this stuff once query arrays are available across threads 
	int nextGet;
	Iterator getIterator;
	synchronized public Object get(int index) {
		if(getIterator == null || nextGet > index) {
			getIterator = iterator();
			nextGet = 0;
		}
		for(; nextGet < index; nextGet++)
			getIterator.next();
		if(getIterator.hasNext()){
			nextGet++;
			return getIterator.next();
		}
		return NOT_FOUND;
	}
	public int indexOf(Object o) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public boolean isEmpty() {
		return !iterator().hasNext();
	}
	public Iterator iterator() {
		return new QueryArrayIterator();
	}
	public int lastIndexOf(Object o) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public ListIterator listIterator() {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public ListIterator listIterator(int index) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public Object remove(int index) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean remove(Object o) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean removeAll(Collection c) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public boolean retainAll(Collection c) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public Object set(int index, Object element) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public int size() {
		return sourceCollection.size();
	}	
	public long estimatedSize(long exactWithin) {
		return sourceCollection instanceof QueryCollection ? ((QueryCollection) sourceCollection).estimatedSize(exactWithin) : sourceCollection.size();
	}
	public List subList(final int fromIndex, final int toIndex) {
		if(sourceCollection instanceof List)
			return new QueryArray(((List)sourceCollection).subList(fromIndex, toIndex));
		final Iterator iter = iterator();
		return new QueryArray(new AbstractList(){

			@Override
			public Iterator iterator() {
				final Iterator iter = QueryArray.this.iterator();
				
				for(int i = 0;i < fromIndex; i++){
					iter.next();
				}
				
				return new Iterator(){
					int left = toIndex - fromIndex;	
					public boolean hasNext() {
						return iter.hasNext() && left > 0;
					}

					public Object next() {
						left--;
						return iter.next();
					}

					public void remove() {
						throw new UnsupportedOperationException("Not implemented yet");
					}
					
				};
			}

			@Override
			public Object get(int arg0) {
				throw new UnsupportedOperationException("Not implemented yet");
			}

			@Override
			public int size() {
				throw new UnsupportedOperationException("Not implemented yet");
			}
			
		});
	}
	public Object[] toArray() {
		Object[] array = new Object[size()];
		int i = 0;
		for(Object item : this){
			array[i++] = item;
		}
		return array;
	}
	public Object[] toArray(Object[] a) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public void delete() {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	public Set<Entry<String, Object>> entrySet(int options) {
		return Collections.emptySet();
	}
	public Object get(String name, Scriptable start) {
		if("length".equals(name)){
			return size();
		}
		return super.get(name, start);
	}
	public void onCreation() {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public Object set(String name, Object value) {
		throw new UnsupportedOperationException("Can not modify queries");
	}
	Collection sourceCollection;
	@Override
	public String getClassName() {
		return "Query";
	}
	static class IteratorNextFunction extends PersevereNativeFunction{
		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
			Object item = ((IteratorObject)thisObj).queryIterator.next();
			if(item == null)
	            throw new JavaScriptException(
	                    NativeIterator.getStopIterationObject(scope), null, 0);
			return item;
		}
		
	}
	static IteratorNextFunction iteratorNextInstance = new IteratorNextFunction();
	static class IteratorObject extends NativeObject {
		Iterator queryIterator; 
		public IteratorObject(Iterator queryIterator) {
			super();
			this.queryIterator = queryIterator;
		}

		@Override
		public Object get(String name, Scriptable start) {
			if("next".equals(name)){
				return iteratorNextInstance;
			}
			return NOT_FOUND;
		}

		
	}
	public static void setupQuery() {
		Scriptable global = GlobalData.getGlobalScope();
		Scriptable queryConstructor = (Scriptable) global.get("Query",global);
		Scriptable queryPrototype = (Scriptable) queryConstructor.get("prototype",queryConstructor);
		queryPrototype.put("__iterator__", queryPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				IteratorObject iterator = new IteratorObject(((List) thisObj).iterator());
				ScriptRuntime.setObjectProtoAndParent(iterator, GlobalData.getGlobalScope());
				return iterator;
			}
			
		});
	/*	global.put("Query", global, queryConstructor = new PersevereNativeFunction(){
			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				throw new UnsupportedOperationException("Not implemented yet");
			}
			@Override
			public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
				throw new UnsupportedOperationException("Not implemented yet");
			}
		});
		queryConstructor.put("prototype", start, value)*/
		
	}
	@Override
	public Object get(int index, Scriptable start) {
		return get(index);
	}
	static Object convertSourceObject(Object value){
        if (value instanceof TargetRetriever) 
        	value = ((TargetRetriever)value).getTarget();
        if (value instanceof Date) // TODO: Do we need to find a way to make this return the same date each time, I don't know if it is even possible with objects being collected
        	return ScriptRuntime.newObject(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), "Date", new Object[] {((Date)value).getTime()});
        return value;
	}
	class QueryArrayIterator implements Iterator {
		Iterator sourceIterator = sourceCollection.iterator();
		public boolean hasNext() {
			return sourceIterator.hasNext();
		}

		public Object next() {
    		if(PersistableObject.securityEnabled.get() != null){
    			PersistableObject.checkSecurity(QueryArray.this, PermissionLevel.READ_LEVEL.level);
    		}
    		try{
    			return convertSourceObject(sourceIterator.next());
    		}catch(NoSuchElementException e){
    			return null;
    		}
		}

		public void remove() {
			throw new UnsupportedOperationException("Not implemented yet");
		}
	}
}
