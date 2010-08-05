package org.persvr.data;

import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.ConcurrentModificationException;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.JavaScriptException;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeIterator;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.data.PersistableObject.FullSet;
import org.persvr.datasource.ChangeableData;
import org.persvr.datasource.ReferenceAwareDataSource;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.security.PermissionLevel;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;
import org.persvr.util.CompareValues;

public class PersistableArray extends NativeArray implements List,PersistableList,ObservablePersistable, PropertyChangeListener {
	public static class ElementsLoader {
		int initializedLength = Integer.MAX_VALUE;
		Iterator iterator;
		boolean initialized;
	}
	ElementsLoader elementsLoader;
    public PersistableArray(long lengthArg)
    {
        super(0);
        super.put("length", this, lengthArg);
    }

    public PersistableArray(Object[] array){
    	super(0);
		// this puts the array in sparse mode, so that elements 
		// are looked up within all internal methods 
		super.put("length", this, array.length);
		int i = 0;
    	for(Object object : array){
    		super.put(i++, this, object);
    	}
    }
	public void initSourceCollection(Collection sourceCollection){
		ElementsLoader elementsLoader = new ElementsLoader();
		elementsLoader.iterator = sourceCollection.iterator();
		elementsLoader.initializedLength = 0;
		this.elementsLoader = elementsLoader;
		superPutLength(sourceCollection.size());
		elementsLoader.initialized = true;
	}
	protected void fullyFetch(){
		if (elementsLoader != null && elementsLoader.iterator != null)
			fetchNextPage(Integer.MAX_VALUE);
	}
	public static long maxIterations = 10000;
	
	static class FilterFunction extends BaseFunction{
		Function defaultFunction;
		
		public FilterFunction(Function defaultFunction) {
			super();
			this.defaultFunction = defaultFunction;
		}
		//TODO: Do a custom map function as well
		@Override
		public Object call(final Context cx, final Scriptable scope, final Scriptable thisObj, Object[] args) {
			// try to do a pass-through to the data source
			if (thisObj instanceof Persistable && ((Persistable) thisObj).getId() instanceof Query){
				try {
					return Query.parseQuery((Query) ((Persistable) thisObj).getId(), scope, ((Function)args[0]), true, false).getTarget();
				} catch (QueryCantBeHandled e) {
					// pass through failed, we will go to the default handler
					LogFactory.getLog(PersistableArray.class).debug("query can't be handled at the database level (will be filtered in JavaScript) " + e);
				}
			}
			if (thisObj instanceof QueryArray){
		        Object callbackArg = args.length > 0 ? args[0] : Undefined.instance;
		        if (callbackArg == null || !(callbackArg instanceof Function)) {
		            throw ScriptRuntime.notFunctionError(
		                     ScriptRuntime.toString(callbackArg));
		        }
		        final Function f = (Function) callbackArg;

				return new QueryArray(null){
					long sizeEstimate = ((QueryArray)thisObj).estimatedSize(0);
					int lastSizeEstimateIndex = -1;
					@Override
					public Iterator iterator() {
						final Iterator sourceIterator = ((List)thisObj).iterator();
						
						return new Iterator(){
							int i = -1;
							Object next;
							private void getNext(){
								do{
									next = Scriptable.NOT_FOUND;
									if(!sourceIterator.hasNext())
										return;
									i++;
									if(i % 100 == 0){
										if(i > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
											throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
										}
									}
									next = sourceIterator.next();
									if(ScriptRuntime.toBoolean(f.call(cx, scope, thisObj, new Object[]{next, i, thisObj})))
										return;
									if(i > lastSizeEstimateIndex){
										lastSizeEstimateIndex = i;
										sizeEstimate--;
									}
								}while(true);
							}
							public boolean hasNext() {
								if(next == null)
									getNext();
								return next != Scriptable.NOT_FOUND;
								
							}

							public Object next() {
								if(next == null)
									getNext();
								if(next == Scriptable.NOT_FOUND)
						            throw new JavaScriptException(
						                    NativeIterator.getStopIterationObject(scope), null, 0);

								Object value = next;
								next = null;
								return value;
							}

							public void remove() {
								throw new UnsupportedOperationException("Not implemented yet");
							}
							
						};
					}

					@Override
					public int size() {
						int size = 0;
						for(Object val : this){
							size++;
						}
						return size;
					}
					@Override
					public long estimatedSize(long exactWithin) {
						if(exactWithin > lastSizeEstimateIndex){
							Iterator iterator = iterator();
							for(long i = 0; i < exactWithin && iterator.hasNext(); i++){
								iterator.next();
							}
						}
						return sizeEstimate;
					}
					
				};
			}
			return defaultFunction.call(cx, scope, thisObj, args);
		}

	}
	
	static class FastSortFunction extends BaseFunction{
		Function defaultFunction;
		
		public FastSortFunction(Function defaultFunction) {
			super();
			this.defaultFunction = defaultFunction;
		}
		@Override
		public Object call(final Context cx, final Scriptable scope, Scriptable thisObj, final Object[] args) {
			// try to do a pass-through to the data source
			if (thisObj instanceof Persistable){
				final boolean ascending = (Boolean)args[1];
				try {
					// first we try to do it at the data source level
					ObjectId id = ((Persistable) thisObj).getId();
					if(args.length < 3) {
						// TODO: once the data sources support multiple sort parameters, this should be removed 
						if(id instanceof Query)
							return Query.parseQuery((Query) id, scope, ((Function)args[0]), false, ascending).getTarget();
					}
				} catch (QueryCantBeHandled e) {
					// pass through failed, we will go to the default handler
					LogFactory.getLog(PersistableArray.class).debug("query can't be handled at the database level (will be filtered in JavaScript) " + e);
				} catch (NullPointerException e){
					throw new RuntimeException("Sorting query can't be parsed", e);
				}
				List listToBeSorted = Arrays.asList(((List)thisObj).toArray());
				Collections.sort(listToBeSorted, new Comparator(){
					int i;
					public int compare(Object o1, Object o2) {
						int sortIndex = 0;
						i++;
						if(i % 100 == 0){
							if(i > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
								throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries");
							}
						}
						if (o1 instanceof Scriptable && o2 instanceof Scriptable){
							while(sortIndex < args.length){
								Function func = ((Function)args[sortIndex]);
								boolean ascending = (Boolean)args[sortIndex + 1];
								Object v1;
								try{
									v1 = func.call(cx, scope, (Scriptable) o1, new Object[]{o1});
								}catch(EcmaError e){
									v1 = Undefined.instance;
								}
								Object v2;
								try{
									v2 = func.call(cx, scope, (Scriptable) o2, new Object[]{o2});
								}catch(EcmaError e){
									v2 = Undefined.instance;
								}
								int comparison = CompareValues.instance.compare(v1, v2);
								if (comparison != 0)
									return (ascending ? 1 : -1) * comparison;
								sortIndex += 2;
							}
						}
						return 0;
					}
					
				});
				return new QueryArray(listToBeSorted);
			}
			return defaultFunction.call(cx, scope, thisObj, args);
		}

	}

	static{
		ScriptableObject arrayPrototype = (ScriptableObject) ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Array");
		Function function = (Function) arrayPrototype.get("filter", arrayPrototype);
		arrayPrototype.put("filter", arrayPrototype,new FilterFunction((Function) arrayPrototype.get("filter",arrayPrototype)));
		final Function fastSortFunction = new FastSortFunction((Function) arrayPrototype.get("sort",arrayPrototype));
		arrayPrototype.put("fastSort", arrayPrototype,fastSortFunction);
		arrayPrototype.setAttributes("fastSort", ScriptableObject.DONTENUM);
		arrayPrototype.put("distinct", arrayPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				// find all the distinct entries, easily done by adding it to a set
				Set distinctItems = new LinkedHashSet();
			 
				if(((List)thisObj).size() > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
					throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
				}
				distinctItems.addAll((List) thisObj);
				// TODO: implement maxIterations check
				distinctItems.remove(Undefined.instance); // we don't want this in the list
				PersistableArray results = new PersistableArray(distinctItems.toArray());
				ScriptRuntime.setObjectProtoAndParent(results, GlobalData.getGlobalScope());
				return results;
			}
			
		});
		arrayPrototype.setAttributes("distinct", ScriptableObject.DONTENUM);
		arrayPrototype.put("contains", arrayPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				// see if any item matches any of the arguments
				int i = 0;
				for(Object value : args){
					i++;
					if(i % 100 == 0){
						if(i > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
							throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
						}
					}
					if(value instanceof Function){
						Function func = (Function)value;
						for(Object obj : (List) thisObj){
							if(Boolean.TRUE.equals(func.call(cx, scope, thisObj, new Object[]{obj})))
								return true;
						}
					}
					if(value == null){
						// fast comparison for nulls
						for(Object obj : (List) thisObj){
							if(obj == null)
								return true;
						}
					}
					else if(value instanceof Number){
						// use the script runtime for numbers
						for(Object obj : (List) thisObj){
							if(ScriptRuntime.shallowEq(value, obj)){
								return true;
							}
						}
					}
					else {
						for(Object obj : (List) thisObj){
							if(value.equals(obj)){
								return true;
							}
						}
					}
				}
				return false;
			}
			
		});
		final Function identityFunction = new PersevereNativeFunction(){
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				return args[0];
			}
		};
		arrayPrototype.setAttributes("contains", ScriptableObject.DONTENUM);
		arrayPrototype.put("sum", arrayPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				Function func = args.length == 0 ? identityFunction : (Function)args[0];
				double sum = 0;
				int i = 0;
				for(Object obj : (List) thisObj){
					i++;
					if(i % 100 == 0){
						if(i > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
							throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
						}
					}
					Object result = func.call(cx, scope, thisObj, new Object[]{obj});
					if (result instanceof Number)
						sum += ((Number)result).doubleValue();
				}
				return sum;
			}
			
		});
		arrayPrototype.setAttributes("sum", ScriptableObject.DONTENUM);
		arrayPrototype.put("max", arrayPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				Function func = args.length == 0 ? identityFunction : (Function)args[0];
				double max = 0;
				boolean first = true;
				int i = 0;
				for(Object obj : (List) thisObj){
					i++;
					if(i % 100 == 0){
						if(i > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
							throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
						}
					}
					Object result = func.call(cx, scope, thisObj, new Object[]{obj});
					if (result instanceof Number){
						if(first){
							first = false;
							max = ((Number)result).doubleValue();
						}
						else{
							max = Math.max(max, ((Number)result).doubleValue());
						}
					}
						
				}
				return max;
			}
			
		});
		arrayPrototype.setAttributes("max", ScriptableObject.DONTENUM);
		arrayPrototype.put("min", arrayPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				Function func = args.length == 0 ? identityFunction : (Function)args[0];
				double min = 0;
				boolean first = true;
				int i = 0;
				for(Object obj : (List) thisObj){
					i++;
					if(i % 100 == 0){
						if(i > maxIterations && PersistableObject.isSecurityEnabled() && !UserSecurity.hasPermission(SystemPermission.runLongQueries)){
							throw ScriptRuntime.constructError("AccessError", "Query has taken too much computation, and the user is not allowed to execute resource-intense queries. Increase maxIterations in your config file to allow longer running non-indexed queries to be processed.");
						}
					}

					Object result = func.call(cx, scope, thisObj, new Object[]{obj});
					if (result instanceof Number){
						if(first){
							first = false;
							min = ((Number)result).doubleValue();
						}
						else{
							min = Math.min(min, ((Number)result).doubleValue());
						}
					}
						
				}
				return min;
			}
			
		});
		arrayPrototype.setAttributes("min", ScriptableObject.DONTENUM);
		//TODO: finish the group method
		/*arrayPrototype.put("group", arrayPrototype, new PersevereNativeFunction(){

			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				List sorted = (List) fastSortFunction.call(cx, scope, thisObj, args);
				List nextGroup, grouped = Persevere.newArray();
				 
				for(Object item : sorted){
					if(!match){
						nextGroup = Persevere.newArray();
						grouped.add(nextGroup);
					}
					nextGroup.add(item);
				}
				return grouped;
			}
			
		});
		arrayPrototype.setAttributes("group", ScriptableObject.DONTENUM);*/
	}
	protected synchronized void fetchNextPage(int limit){
		//TODO: may be better to synchronize on the iterator itself 
		if (elementsLoader != null && elementsLoader.iterator != null) {
			Iterator iterator = elementsLoader.iterator;
			while(iterator.hasNext()){
				super.put(elementsLoader.initializedLength, this, iterator.next());
				elementsLoader.initializedLength++;
				if (elementsLoader.initializedLength >= limit){
					return;
				}
			}
		}
		elementsLoader.iterator = null;
		elementsLoader.initializedLength = Integer.MAX_VALUE;
	}
	public Object remove(int index) {
		fullyFetch();
		Object result = get(index);
		((Function)get("splice")).call(PersevereContextFactory.getContext(),GlobalData.getGlobalScope(),this,new Object[]{index,1});
		return result;
	}
	void noCheckSet(int index,Object value) {
		super.put(index,this,value);
	}
    public Object execIdCall(IdFunctionObject f, Context cx, Scriptable scope,
            Scriptable thisObj, Object[] args)
    {
    	fullyFetch();
    	return super.execIdCall(f, cx, scope, thisObj, args);
    }
	public List subList(int fromIndex, int toIndex) {
		if(fromIndex == 0 && toIndex == size())
			return this;
		return (List) ((Function)get("slice")).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), this, new Object[]{fromIndex,toIndex});
	}
	public Object get(int index) {
		return get(index,this);
	}	
	public static int fetchSize = 20;
	public boolean has(int index, Scriptable start) {
    	if (id != null && id.source != null) { 
    		if (elementsLoader != null && index >= elementsLoader.initializedLength)
    			fetchNextPage(index + fetchSize);
    		if (transactionalVersion != null) {
	    		PersistableArray currentVersion = (PersistableArray) transactionalVersion.getTarget();
	    		if(currentVersion != this && currentVersion != null)
	    			return currentVersion.has(index, start);
    		}
    	}
    	return super.has(index, start);
	}
	long lastUpdated;
	private static final int CACHE_TIME = 200;

	private void updateObject(){
		//TODO: We may be able to optimize this better by using a HashMap of 
		//	id to last updated so non-changeable data doesn't increase memory size.
		//	Also we might have a timer that updates a static variable for faster 
		//	access to the current time in millis.
		if(id.source instanceof ChangeableData){
			long currentTime = System.currentTimeMillis();
			if(currentTime - lastUpdated > CACHE_TIME){
				lastUpdated = currentTime;
				if (((ChangeableData)id.source).doesObjectNeedUpdating(id.subObjectId)) {
					PersistableObject.mapPersistent(id);
				}
			}
		}
	}

	TransactionValue transactionalVersion;
	@Override
	public Object get(int index, Scriptable start) {		
    	if (id != null && id.source != null) {
    		updateObject();
    		if (elementsLoader != null && index >= elementsLoader.initializedLength)
    			fetchNextPage(index + fetchSize);
    		
    		if(PersistableObject.securityEnabled.get() != null){
    			PersistableObject.checkSecurity(this, PermissionLevel.READ_LEVEL.level);
    		}
    		if (transactionalVersion != null) {
	    		PersistableArray currentVersion = (PersistableArray) transactionalVersion.getTarget();
	    		if(currentVersion != this && currentVersion != null)
	    			return currentVersion.get(index, start);
    		}
        	Object value = super.get(index,start);
            try {
    			while (value instanceof TargetRetriever) 
    				value = ((TargetRetriever)value).getTarget();
    		} catch (ObjectNotFoundException e) {
    			value = null;
    		}
            if (value instanceof Date) // TODO: Do we need to find a way to make this return the same date each time, I don't know if it is even possible with objects being collected
            	return ScriptRuntime.newObject(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), "Date", new Object[] {((Date)value).getTime()});
            return value;
    	}
    	return super.get(index,start);
    }
	
	@Override
	public long getLength() {
		if (id != null && id.source != null){
			updateObject();
			if(transactionalVersion != null) {
	    		PersistableArray currentVersion = (PersistableArray) transactionalVersion.getTarget();
	    		if(currentVersion != this && currentVersion != null)
	    			return currentVersion.getLength();
			}
		}

        return super.getLength();
	}
	void superPutLength(long length){
		super.put("length", this, length);
	}
	@Override
    protected Object getInstanceIdValue(int id)
    {
        if (elementsLoader != null && elementsLoader.iterator != null && id == 1) {
        	getLength();
        }
        return super.getInstanceIdValue(id);
    }
	public void propertyChange(PropertyChangeEvent evt) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public Object noCheckGet(String key) {
		return super.get(key,this);
	}
	public Object noCheckGet(int index) {
    	if (id != null && id.source != null) { 
    		if (elementsLoader != null && index >= elementsLoader.initializedLength)
    			fetchNextPage(index + fetchSize);
    		
    	}
    	Object value = super.get(index,this);
        try {
			while (value instanceof TargetRetriever) 
				value = ((TargetRetriever)value).getTarget();
		} catch (ObjectNotFoundException e) {
			value = null;
		}
        if (value instanceof Date) // TODO: Do we need to find a way to make this return the same date each time, I don't know if it is even possible with objects being collected
        	return ScriptRuntime.newObject(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), "Date", new Object[] {((Date)value).getTime()});
        return value;
	}
	public void delete() {
		if(PersistableObject.securityEnabled.get() != null){
			PersistableObject.checkSecurity(this, PermissionLevel.FULL_LEVEL.level);
		}
		// TODO: The reference cleanup is not transactionally isolated
		if(id.source instanceof ReferenceAwareDataSource && id.subObjectId != null){
			if(id.subObjectId.length() == 0){
				ObjectId.idForObject(DataSourceManager.getMetaClassSource(), id.source.getId()).getTarget().delete();
				return;
			}
			List<ObjectId> referrers = ((ReferenceAwareDataSource)id.source).getReferrers(id.subObjectId);
			for (ObjectId objRef: referrers) {
				Persistable obj = objRef.getTarget();
				if (obj instanceof List) 
					((List)obj).remove(this);
				else {
					for (Map.Entry<String,Object> entry : obj.entrySet(1)) {
						if (entry.getValue() == this) {
							((Persistable)entry.getValue()).delete(entry.getKey());
						}
					}
				}
			}
		}

		new TransactionValue(this,null, Scriptable.NOT_FOUND);
	}
	public void subscribe() {
    	Map<ObjectId, Set<String>> readSet = PersistableObject.readSets.get();
    	if (readSet != null) {
    		readSet.put(id, FullSet.instance);
    	}
	}

	public Object get(String key, Scriptable start) {
		if("length".equals(key)){
    		if (transactionalVersion != null) {
	    		PersistableArray currentVersion = (PersistableArray) transactionalVersion.getTarget();
	    		if(currentVersion != this && currentVersion != null)
	    			return currentVersion.get(key);
    		}
		}
		return super.get(key, start);
	}
	public Object get(String key) {
		if("length".equals(key)){
    		if (transactionalVersion != null) {
	    		PersistableArray currentVersion = (PersistableArray) transactionalVersion.getTarget();
	    		if(currentVersion != this && currentVersion != null)
	    			return currentVersion.get(key);
    		}
		}
    	Object value = ScriptableObject.getProperty(this,key);
        while (value instanceof TargetRetriever) 
        	value = ((TargetRetriever)value).getTarget();
        if (value instanceof Date) // TODO: Do we need to find a way to make this return the same date each time, I don't know if it is even possible with objects being collected
        	return ScriptRuntime.newObject(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), "Date", new Object[] {((Date)value).getTime()});
        return value;
	}
	public int getAccessLevel() {
		return PersistableObject.checkSecurity(this, -1);
	}

	public PersistableList<Persistable> getHistory() {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	public ObjectId getId() {
		if (id == null)
			return (id = new NewObjectId(this));
		return id;
	}
	public Persistable getParent() {
		return (Persistable) (parent instanceof Persistable ? parent :
					parent instanceof Query ? parent = ((Query)parent).getCachedTarget() :
					parent instanceof ObjectId ? parent = ((ObjectId) parent).getTarget() :
					id != null && id.source != null ? 
								(this == (parent = ((Query) ObjectId.idForObject(id.source, "")).getCachedTarget())) ? (parent = null) : parent :
						null);
	}
	public Persistable getSchema() {
		return schema;
	}
	public void onCreation() {
	}
	public Object set(String name, Object value) {
		put(name, this,value);
		return value;
	}
	int universalPermissionLevel;
	ObjectId id;
	Object parent;
	Persistable schema;
	
	static void commitIfImmediate() {
		Transaction.currentTransaction().commitIfImmediate();
	}
	static class TransactionValueArray extends TransactionValue {
		public TransactionValueArray(Persistable target, String property, Object defaultValue) {
			super(target, property, defaultValue);
		}
	}
	PersistableArray getOrCreateModTarget() {
		if (id !=null && id.source != null && !(id instanceof Query)) {
			if(transactionalVersion instanceof TransactionValueArray)
				return this;
			fullyFetch();
			if (transactionalVersion == null) 
				transactionalVersion = new TransactionValue(this,null,this);
			PersistableArray target = (PersistableArray) transactionalVersion.getTarget();
			if (target == this) {
				try {
					target = getClass().getConstructor(Object[].class).newInstance(new Object[]{toArray()});
				}catch(Exception e){
					throw new RuntimeException(e);
				}
	    		target.setPrototype(getPrototype());
	    		target.id = id;
	    		target.parent = parent;
	    		target.universalPermissionLevel = universalPermissionLevel;
	    		target.transactionalVersion = new TransactionValueArray(target,null,target);
	    		transactionalVersion.setValue(this, null, target);
			}
			return target;
		}
		return this;
	}
	public void put(int index, Scriptable start, Object value)
    {
		if (id !=null && id.source != null && !(id instanceof Query) && start == this) {
			
			PersistableObject.checkPut(this,index,value);
			Persistable parent = getParent();
			for(Map.Entry<String, Object> entry : getParent().entrySet(1)){
				if(entry.getValue() == this){
					Object props = parent.getSchema().get("properties");
					if(props instanceof Persistable){
						Object propDef = ((Persistable)props).get(entry.getKey());
						if(propDef instanceof Persistable){
							value = PersistableClass.enforceSchemaForProperty((Persistable) propDef, this, index,value, true, false, true);
						}
					}
				}
			}
			PersistableArray target = getOrCreateModTarget();
			target.superPut(index, target, value);
			commitIfImmediate();
			return;
    	}
    	super.put(index, start, value);
    }
	private void superPut(int index, Scriptable start, Object value){
		super.put(index, start, value);
	}
	
    @Override
	public void put(String name, Scriptable start, Object value) {
    	if (id != null && id.source != null && !(id instanceof Query) && "length".equals(name)){
    		if(PersistableObject.securityEnabled.get() != null){
    			PersistableObject.checkSecurity(this, PermissionLevel.WRITE_LEVEL.level);
    		}

    		PersistableArray target = getOrCreateModTarget();
    		target.superPut(name, target, value);
    	}
    	else
    		super.put(name, start, value);
    
	}
	private void superPut(String name, Scriptable start, Object value){
		super.put(name, start, value);
	}
	public void delete(int index)
    {
		if (id != null && id.source != null && !(id instanceof Query)) {
    		if(PersistableObject.securityEnabled.get() != null){
    			PersistableObject.checkSecurity(this, PermissionLevel.WRITE_LEVEL.level);
    		}
    		if(elementsLoader == null || elementsLoader.initialized){
    			getOrCreateModTarget().superDelete(index);
    			commitIfImmediate();
    		}
    	}
        super.delete(index);
    }
    private void superDelete(int index){
    	super.delete(index);
    }
	boolean isModifying = false;

	public Set<String> keySet(boolean includeDontEnum) { // an array should not include the integers
		Object[] ids = getIds();
		Set<String> keySet = new HashSet();
		for (Object id : ids)
			if (id instanceof String)
				keySet.add((String) id);
		return keySet;
	}
	public Set<Map.Entry<String, Object>> entrySet(int options){
		return new HashSet();
	}
	public boolean add(Object value) {		
		put(size(), this, value);
/*		if (isPersistingList) {
			DataObject historyEntry = newHistoryEntry();
			if (historyEntry != null)
				historyEntry.set(GlobalData.BASIS_FIELD,convertToIdIfNeeded(Templates.findTemplate("historyAppend")));
		}*/
     	return true;
    }

    public Object set(int index, Object element) {
    	put(index,this,element);
    	return element;
    }
   /* @Override
	public void put(int index, Scriptable start, Object value)
    {
    	if (isPersistingList && !isModifying) {
    		int size = size();
        	if (index == size)
        		checkAppendSecurity();
        	else
        		checkWriteSecurity(this);
	       	try {
	    		Identification id = getId();
	    		if (id.source != null) { 
			    	if (id.source instanceof IndexedListDataSource && index != size)
			    		((IndexedListDataSource) id.source).recordListReplace(id.objectId, index, convertToIdIfNeeded(value));
			    	else {
			    		if (index != size)
			    			delete(index);
			    		id.source.recordListAdd(id.objectId, convertToIdIfNeeded(value));
			    	}
	    		}
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
    	}
   		super.put(index, start, value);
    }*/
    public void add(int index, Object element) {
        /*   if (data == null) 
               data = new TransientDataObjectList();*/
		fullyFetch();
    	PersistableObject.enforceObjectChange(this,0, element, true);
    	Object oldValue = super.get(index,this);
    	if (id != null && id.source != null && !(id instanceof Query)) {
    		if(PersistableObject.securityEnabled.get() != null){
    			PersistableObject.checkSecurity(this, PermissionLevel.WRITE_LEVEL.level);
    		}

       	}
    	boolean middle = index != ((PersistableArray)this).size();
    	put(index,this,element);
    	if (middle)
    		add(index+1,oldValue);
   }

    public boolean remove(Object o) {
		fullyFetch();

    	int index = indexOf(o);
    	if (index == -1)
    		return false;
    	//TODO: Must set this directly, this is terribly inefficient
		remove(index);
    	return true;
    }

    /*protected boolean addFromSourceIterator() {
    	if (iterator.hasNext()) {
    		super.put((int) ((NativeArray)this).getLength(), this, iterator.next());
    		return true;
    	}
    	return false;
    }*/
/*	@Override
	public Object get(int index, Scriptable start) {
		
		Object value;
		do {
			value = super.get(index,this);
		}
		while (value == Scriptable.NOT_FOUND && addFromSourceIterator()); 
        return value;
    }
    */ 
     
     
    public int size() {
    	return (int) getLength();
	}
	@Override
	public String getClassName() {
		return "Array";
	}
/*	public static PersistentList filter(List superList, Stipulation stipulation) {
		QueryId filterObjectId = QueryId.idForObject(((PersistentList)superList).id.source, ((PersistentList)superList).id.subObjectId, stipulation);
		return (PersistentList) filterObjectId.getTarget();
	}
	Iterator iterator;
	public Stipulation getStipulation() {
		if (id instanceof QueryId)
			return ((QueryId)id).stipulation;
		else
			return null;
	}*/
	/* From AbstractCollection */
    /**
     * {@inheritDoc}
     *
     * <p>This implementation returns <tt>size() == 0</tt>.
     */
    public boolean isEmpty() {
	return size() == 0;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation iterates over the elements in the collection,
     * checking each element in turn for equality with the specified element.
     *
     * @throws ClassCastException   {@inheritDoc}
     * @throws NullPointerException {@inheritDoc}
     */
    public boolean contains(Object o) {
		fullyFetch();
	Iterator e = iterator();
	if (o==null) {
	    while (e.hasNext())
		if (e.next()==null)
		    return true;
	} else {
	    while (e.hasNext())
		if (o.equals(e.next()))
		    return true;
	}
	return false;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation returns an array containing all the elements
     * returned by this collection's iterator, in the same order, stored in
     * consecutive elements of the array, starting with index {@code 0}.
     * The length of the returned array is equal to the number of elements
     * returned by the iterator, even if the size of this collection changes
     * during iteration, as might happen if the collection permits
     * concurrent modification during iteration.  The {@code size} method is
     * called only as an optimization hint; the correct result is returned
     * even if the iterator returns a different number of elements.
     *
     * <p>This method is equivalent to:
     *
     *  <pre> {@code
     * List list = new ArrayList(size());
     * for (E e : this)
     *     list.add(e);
     * return list.toArray();
     * }</pre>
     */
    public Object[] toArray() {
        // Estimate size of array; be prepared to see more or fewer elements
	Object[] r = new Object[size()];
        Iterator it = iterator();
	for (int i = 0; i < r.length; i++) {
	    if (! it.hasNext())	{// fewer elements than expected
    		return copyOf(r, i);
	    }
	    r[i] = it.next();
	}
	return it.hasNext() ? finishToArray(r, it) : r;
    }
    private static Object[] copyOf(Object[] array, int length) {
    	Object[] newArray = new Object[length]; 
    	System.arraycopy(array, 0, newArray, 0, Math.min(length, array.length));
	    return newArray;
    	
    }
    /**
     * {@inheritDoc}
     *
     * <p>This implementation returns an array containing all the elements
     * returned by this collection's iterator in the same order, stored in
     * consecutive elements of the array, starting with index {@code 0}.
     * If the number of elements returned by the iterator is too large to
     * fit into the specified array, then the elements are returned in a
     * newly allocated array with length equal to the number of elements
     * returned by the iterator, even if the size of this collection
     * changes during iteration, as might happen if the collection permits
     * concurrent modification during iteration.  The {@code size} method is
     * called only as an optimization hint; the correct result is returned
     * even if the iterator returns a different number of elements.
     *
     * <p>This method is equivalent to:
     *
     *  <pre> {@code
     * List list = new ArrayList(size());
     * for (E e : this)
     *     list.add(e);
     * return list.toArray(a);
     * }</pre>
     *
     * @throws ArrayStoreException  {@inheritDoc}
     * @throws NullPointerException {@inheritDoc}
     */
    public Object[] toArray(Object[] a) {
		fullyFetch();

        // Estimate size of array; be prepared to see more or fewer elements
        int size = size();
        Object[] r = a.length >= size ? a :
                  (Object[])java.lang.reflect.Array
                  .newInstance(a.getClass().getComponentType(), size);
        Iterator it = iterator();

	for (int i = 0; i < r.length; i++) {
	    if (! it.hasNext()) { // fewer elements than expected
		if (a != r)
		    return copyOf(r, i);
		r[i] = null; // null-terminate
		return r;
	    }
	    r[i] = it.next();
	}
	return it.hasNext() ? finishToArray(r, it) : r;
    }

    /**
     * Reallocates the array being used within toArray when the iterator
     * returned more elements than expected, and finishes filling it from
     * the iterator.
     *
     * @param r the array, replete with previously stored elements
     * @param it the in-progress iterator over this collection
     * @return array containing the elements in the given array, plus any
     *         further elements returned by the iterator, trimmed to size
     */
    private static  Object[] finishToArray(Object[] r, Iterator<?> it) {
	int i = r.length;
        while (it.hasNext()) {
            int cap = r.length;
            if (i == cap) {
                int newCap = ((cap / 2) + 1) * 3;
                if (newCap <= cap) { // integer overflow
		    if (cap == Integer.MAX_VALUE)
			throw new OutOfMemoryError
			    ("Required array size too large");
		    newCap = Integer.MAX_VALUE;
		}
		r = copyOf(r, newCap);
	    }
	    r[i++] = it.next();
        }
        // trim if overallocated
        return (i == r.length) ? r : copyOf(r, i);
    }

    // Bulk Operations

    /**
     * {@inheritDoc}
     *
     * <p>This implementation iterates over the specified collection,
     * checking each element returned by the iterator in turn to see
     * if it's contained in this collection.  If all elements are so
     * contained <tt>true</tt> is returned, otherwise <tt>false</tt>.
     *
     * @throws ClassCastException            {@inheritDoc}
     * @throws NullPointerException          {@inheritDoc}
     * @see #contains(Object)
     */
    public boolean containsAll(Collection c) {
	Iterator<?> e = c.iterator();
	while (e.hasNext())
	    if (!contains(e.next()))
		return false;
	return true;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation iterates over the specified collection, and adds
     * each object returned by the iterator to this collection, in turn.
     *
     * <p>Note that this implementation will throw an
     * <tt>UnsupportedOperationException</tt> unless <tt>add</tt> is
     * overridden (assuming the specified collection is non-empty).
     *
     * @throws UnsupportedOperationException {@inheritDoc}
     * @throws ClassCastException            {@inheritDoc}
     * @throws NullPointerException          {@inheritDoc}
     * @throws IllegalArgumentException      {@inheritDoc}
     * @throws IllegalStateException         {@inheritDoc}
     *
     * @see #add(Object)
     */
    public boolean addAll(Collection c) {
	boolean modified = false;
	Iterator e = c.iterator();
	while (e.hasNext()) {
	    if (add(e.next()))
		modified = true;
	}
	return modified;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation iterates over this collection, checking each
     * element returned by the iterator in turn to see if it's contained
     * in the specified collection.  If it's so contained, it's removed from
     * this collection with the iterator's <tt>remove</tt> method.
     *
     * <p>Note that this implementation will throw an
     * <tt>UnsupportedOperationException</tt> if the iterator returned by the
     * <tt>iterator</tt> method does not implement the <tt>remove</tt> method
     * and this collection contains one or more elements in common with the
     * specified collection.
     *
     * @throws UnsupportedOperationException {@inheritDoc}
     * @throws ClassCastException            {@inheritDoc}
     * @throws NullPointerException          {@inheritDoc}
     *
     * @see #remove(Object)
     * @see #contains(Object)
     */
    public boolean removeAll(Collection c) {
	boolean modified = false;
	Iterator<?> e = iterator();
	while (e.hasNext()) {
	    if (c.contains(e.next())) {
		e.remove();
		modified = true;
	    }
	}
	return modified;
    }

    /**
     * {@inheritDoc}
     *
     * <p>This implementation iterates over this collection, checking each
     * element returned by the iterator in turn to see if it's contained
     * in the specified collection.  If it's not so contained, it's removed
     * from this collection with the iterator's <tt>remove</tt> method.
     *
     * <p>Note that this implementation will throw an
     * <tt>UnsupportedOperationException</tt> if the iterator returned by the
     * <tt>iterator</tt> method does not implement the <tt>remove</tt> method
     * and this collection contains one or more elements not present in the
     * specified collection.
     *
     * @throws UnsupportedOperationException {@inheritDoc}
     * @throws ClassCastException            {@inheritDoc}
     * @throws NullPointerException          {@inheritDoc}
     *
     * @see #remove(Object)
     * @see #contains(Object)
     */
    public boolean retainAll(Collection c) {
	boolean modified = false;
	Iterator e = iterator();
	while (e.hasNext()) {
	    if (!c.contains(e.next())) {
		e.remove();
		modified = true;
	    }
	}
	return modified;
    }


     
     /* From AbstractList */





     // Search Operations

     /**
      * {@inheritDoc}
      *
      * <p>This implementation first gets a list iterator (with
      * {@code listIterator()}).  Then, it iterates over the list until the
      * specified element is found or the end of the list is reached.
      *
      * @throws ClassCastException   {@inheritDoc}
      * @throws NullPointerException {@inheritDoc}
      */
     public int indexOf(Object o) {
 	ListIterator e = listIterator();
 	if (o==null) {
 	    while (e.hasNext())
 		if (e.next()==null)
 		    return e.previousIndex();
 	} else {
 	    while (e.hasNext())
 		if (o.equals(e.next()))
 		    return e.previousIndex();
 	}
 	return -1;
     }

     /**
      * {@inheritDoc}
      *
      * <p>This implementation first gets a list iterator that points to the end
      * of the list (with {@code listIterator(size())}).  Then, it iterates
      * backwards over the list until the specified element is found, or the
      * beginning of the list is reached.
      *
      * @throws ClassCastException   {@inheritDoc}
      * @throws NullPointerException {@inheritDoc}
      */
     public int lastIndexOf(Object o) {
 	ListIterator e = listIterator(size());
 	if (o==null) {
 	    while (e.hasPrevious())
 		if (e.previous()==null)
 		    return e.nextIndex();
 	} else {
 	    while (e.hasPrevious())
 		if (o.equals(e.previous()))
 		    return e.nextIndex();
 	}
 	return -1;
     }


     // Bulk Operations

     /**
      * Removes all of the elements from this list (optional operation).
      * The list will be empty after this call returns.
      *
      * <p>This implementation calls {@code removeRange(0, size())}.
      *
      * <p>Note that this implementation throws an
      * {@code UnsupportedOperationException} unless {@code remove(int
      * index)} or {@code removeRange(int fromIndex, int toIndex)} is
      * overridden.
      *
      * @throws UnsupportedOperationException if the {@code clear} operation
      *         is not supported by this list
      */
     public void clear() {
    	 put("length",this,0);
         //removeRange(0, size());
     }

     /**
      * {@inheritDoc}
      *
      * <p>This implementation gets an iterator over the specified collection
      * and iterates over it, inserting the elements obtained from the
      * iterator into this list at the appropriate position, one at a time,
      * using {@code add(int, E)}.
      * Many implementations will override this method for efficiency.
      *
      * <p>Note that this implementation throws an
      * {@code UnsupportedOperationException} unless
      * {@link #add(int, Object) add(int, E)} is overridden.
      *
      * @throws UnsupportedOperationException {@inheritDoc}
      * @throws ClassCastException            {@inheritDoc}
      * @throws NullPointerException          {@inheritDoc}
      * @throws IllegalArgumentException      {@inheritDoc}
      * @throws IndexOutOfBoundsException     {@inheritDoc}
      */
     public boolean addAll(int index, Collection c) {
 	boolean modified = false;
 	Iterator e = c.iterator();
 	while (e.hasNext()) {
 	    add(index++, e.next());
 	    modified = true;
 	}
 	return modified;
     }


     // Iterators

     /**
      * Returns an iterator over the elements in this list in proper sequence.
      *
      * <p>This implementation returns a straightforward implementation of the
      * iterator interface, relying on the backing list's {@code size()},
      * {@code get(int)}, and {@code remove(int)} methods.
      *
      * <p>Note that the iterator returned by this method will throw an
      * {@code UnsupportedOperationException} in response to its
      * {@code remove} method unless the list's {@code remove(int)} method is
      * overridden.
      *
      * <p>This implementation can be made to throw runtime exceptions in the
      * face of concurrent modification, as described in the specification
      * for the (protected) {@code modCount} field.
      *
      * @return an iterator over the elements in this list in proper sequence
      *
      * @see #modCount
      */
     public Iterator iterator() {
 	return new Itr();
     }

     /**
      * {@inheritDoc}
      *
      * <p>This implementation returns {@code listIterator(0)}.
      *
      * @see #listIterator(int)
      */
     public ListIterator listIterator() {
 	return listIterator(0);
     }

     /**
      * {@inheritDoc}
      *
      * <p>This implementation returns a straightforward implementation of the
      * {@code ListIterator} interface that extends the implementation of the
      * {@code Iterator} interface returned by the {@code iterator()} method.
      * The {@code ListIterator} implementation relies on the backing list's
      * {@code get(int)}, {@code set(int, E)}, {@code add(int, E)}
      * and {@code remove(int)} methods.
      *
      * <p>Note that the list iterator returned by this implementation will
      * throw an {@code UnsupportedOperationException} in response to its
      * {@code remove}, {@code set} and {@code add} methods unless the
      * list's {@code remove(int)}, {@code set(int, E)}, and
      * {@code add(int, E)} methods are overridden.
      *
      * <p>This implementation can be made to throw runtime exceptions in the
      * face of concurrent modification, as described in the specification for
      * the (protected) {@code modCount} field.
      *
      * @throws IndexOutOfBoundsException {@inheritDoc}
      *
      * @see #modCount
      */
     public ListIterator listIterator(final int index) {
 	if (index<0 || index>size())
 	  throw new IndexOutOfBoundsException("Index: "+index);

 	return new ListItr(index);
     }

     private class Itr implements Iterator {
 	/**
 	 * Index of element to be returned by subsequent call to next.
 	 */
 	int cursor = 0;

 	/**
 	 * Index of element returned by most recent call to next or
 	 * previous.  Reset to -1 if this element is deleted by a call
 	 * to remove.
 	 */
 	int lastRet = -1;

 	/**
 	 * The modCount value that the iterator believes that the backing
 	 * List should have.  If this expectation is violated, the iterator
 	 * has detected concurrent modification.
 	 */
 	int expectedModCount = modCount;

 	public boolean hasNext() {
             return cursor != size();
 	}

 	public Object next() {
             checkForComodification();
 	    try {
 		Object next = get(cursor);
 		lastRet = cursor++;
 		return next;
 	    } catch (IndexOutOfBoundsException e) {
 		checkForComodification();
 		throw new NoSuchElementException();
 	    }
 	}

 	public void remove() {
 	    if (lastRet == -1)
 		throw new IllegalStateException();
             checkForComodification();

 	    try {
 		PersistableArray.this.remove(lastRet);
 		if (lastRet < cursor)
 		    cursor--;
 		lastRet = -1;
 		expectedModCount = modCount;
 	    } catch (IndexOutOfBoundsException e) {
 		throw new ConcurrentModificationException();
 	    }
 	}

 	final void checkForComodification() {
 	    if (modCount != expectedModCount)
 		throw new ConcurrentModificationException();
 	}
     }

     private class ListItr extends Itr implements ListIterator {
 	ListItr(int index) {
 	    cursor = index;
 	}

 	public boolean hasPrevious() {
 	    return cursor != 0;
 	}

         public Object previous() {
             checkForComodification();
             try {
                 int i = cursor - 1;
                 Object previous = get(i);
                 lastRet = cursor = i;
                 return previous;
             } catch (IndexOutOfBoundsException e) {
                 checkForComodification();
                 throw new NoSuchElementException();
             }
         }

 	public int nextIndex() {
 	    return cursor;
 	}

 	public int previousIndex() {
 	    return cursor-1;
 	}

 	public void set(Object e) {
 	    if (lastRet == -1)
 		throw new IllegalStateException();
             checkForComodification();

 	    try {
 		PersistableArray.this.set(lastRet, e);
 		expectedModCount = modCount;
 	    } catch (IndexOutOfBoundsException ex) {
 		throw new ConcurrentModificationException();
 	    }
 	}

 	public void add(Object e) {
             checkForComodification();

 	    try {
 		PersistableArray.this.add(cursor++, e);
 		lastRet = -1;
 		expectedModCount = modCount;
 	    } catch (IndexOutOfBoundsException ex) {
 		throw new ConcurrentModificationException();
 	    }
 	}
     }


     /**
      * Removes from this list all of the elements whose index is between
      * {@code fromIndex}, inclusive, and {@code toIndex}, exclusive.
      * Shifts any succeeding elements to the left (reduces their index).
      * This call shortens the ArrayList by {@code (toIndex - fromIndex)}
      * elements.  (If {@code toIndex==fromIndex}, this operation has no
      * effect.)
      *
      * <p>This method is called by the {@code clear} operation on this list
      * and its subLists.  Overriding this method to take advantage of
      * the internals of the list implementation can <i>substantially</i>
      * improve the performance of the {@code clear} operation on this list
      * and its subLists.
      *
      * <p>This implementation gets a list iterator positioned before
      * {@code fromIndex}, and repeatedly calls {@code ListIterator.next}
      * followed by {@code ListIterator.remove} until the entire range has
      * been removed.  <b>Note: if {@code ListIterator.remove} requires linear
      * time, this implementation requires quadratic time.</b>
      *
      * @param fromIndex index of first element to be removed
      * @param toIndex index after last element to be removed
      */
     protected void removeRange(int fromIndex, int toIndex) {
         ListIterator it = listIterator(fromIndex);
         for (int i=0, n=toIndex-fromIndex; i<n; i++) {
             it.next();
             it.remove();
         }
     }

     /**
      * The number of times this list has been <i>structurally modified</i>.
      * Structural modifications are those that change the size of the
      * list, or otherwise perturb it in such a fashion that iterations in
      * progress may yield incorrect results.
      *
      * <p>This field is used by the iterator and list iterator implementation
      * returned by the {@code iterator} and {@code listIterator} methods.
      * If the value of this field changes unexpectedly, the iterator (or list
      * iterator) will throw a {@code ConcurrentModificationException} in
      * response to the {@code next}, {@code remove}, {@code previous},
      * {@code set} or {@code add} operations.  This provides
      * <i>fail-fast</i> behavior, rather than non-deterministic behavior in
      * the face of concurrent modification during iteration.
      *
      * <p><b>Use of this field by subclasses is optional.</b> If a subclass
      * wishes to provide fail-fast iterators (and list iterators), then it
      * merely has to increment this field in its {@code add(int, E)} and
      * {@code remove(int)} methods (and any other methods that it overrides
      * that result in structural modifications to the list).  A single call to
      * {@code add(int, E)} or {@code remove(int)} must add no more than
      * one to this field, or the iterators (and list iterators) will throw
      * bogus {@code ConcurrentModificationExceptions}.  If an implementation
      * does not wish to provide fail-fast iterators, this field may be
      * ignored.
      */
     protected transient int modCount = 0;
	public int getUniversalPermissionLevel() {
		return universalPermissionLevel;
	}
	public void setUniversalPermissionLevel(int universalPermissionLevel) {
		this.universalPermissionLevel = universalPermissionLevel;
	}
	@Override
	public boolean equals(Object obj) {
		return obj instanceof PersistableArray && ((PersistableArray)obj).getId() == id;
	}
    public Date getLastModified() {
      	 //TODO: Need to implement this with the new history system
   		return lastModified;
   	}
    Date lastModified = new Date();
	public String toString() {
		return getId().isPersisted() ? getId().toString() : super.toString();
    }

	@Override
	public Object[] getIds() {
		fullyFetch();
		return super.getIds();
	}

	Version version;
	public Version getVersion() {
		return version;
	}

	public static void setMaxIterations(long maxIterations) {
		PersistableArray.maxIterations = maxIterations;
	}

 }

