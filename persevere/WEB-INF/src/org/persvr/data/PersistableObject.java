package org.persvr.data;

import java.beans.PropertyChangeListener;
import java.lang.ref.SoftReference;
import java.security.Principal;
import java.security.acl.Acl;
import java.util.AbstractSet;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.Map.Entry;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeFunction;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.UniqueTag;
import org.persvr.data.DataSourceManager.SourceInfo;
import org.persvr.data.Transaction.ChangeUpdate;
import org.persvr.datasource.ChangeableData;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.ListDataSource;
import org.persvr.datasource.NewObjectPersister;
import org.persvr.datasource.PersistableInitializer;
import org.persvr.datasource.ReferenceAwareDataSource;
import org.persvr.datasource.WritableDataSource;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.security.PermissionLevel;
import org.persvr.security.UserSecurity;

/**
 * This class adds the capability to persist data for Rhino Scriptables
 * @author Kris Zyp
 *
 */
public class PersistableObject extends NativeObject implements ObservablePersistable {
	private static final long serialVersionUID = 1509175903523676521L;
	public Object noCheckGet(String key) {
		Object value = super.get(key,this);
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
	static ThreadLocal<Object> securityEnabled = new InheritableThreadLocal<Object>();
	public static void enableSecurity(boolean enable){
		securityEnabled.set(enable ? SECURITY_ENABLED_OBJECT : null);
	}
	public static boolean isSecurityEnabled(){
		return securityEnabled.get() != null;
	}
	static Object SECURITY_ENABLED_OBJECT = new Object();
	void noCheckSet(String key,Object value) {
		if (value == Scriptable.NOT_FOUND)
			super.delete(key);
		else
			super.put(key,this,value);
	}
	public PersistableObject() {

	}
	protected ObjectId id;
	Object parent;
	Persistable schema;

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
				if (((ChangeableData)id.source).doesObjectNeedUpdating(id.subObjectId))
					mapPersistent(id);
			}
		}
	}
	public ObjectId getId() {
		if (id == null)
			return (id = new NewObjectId(this));
		return id;
	}
    //TODO: It would be nice if this was package protected to Client
    public Object getCoreValue(String name) {
        Object value = super.get(name, this);
        if(value instanceof TransactionValue){
        	value = ((TransactionValue)value).getTarget();
        }
        return value;
    }
    public Object get(String name) {
    	return convertToDateJavaDate(getProperty(this, name));
    }
    private void recordPropertyRead(String name) {
    	Map<ObjectId, Set<String>> readSet = readSets.get();
    	if (readSet != null) {
    		Set<String> propertySet = readSet.get(id);
    		if (propertySet == null) {
    			readSet.put(id, propertySet = new HashSet<String>());
    		}
    		propertySet.add(name);
    	}

    }
    @Override
	public Object get(String name, Scriptable start) {
    	boolean securityCheck = false;
    	if (id != null && id.source != null) {
    		if("id".equals(name)){
    			return id.toString();
    		}
    		if(securityEnabled.get() != null){
    			checkSecurity(this, PermissionLevel.READ_LEVEL.level);
    			securityCheck = true;
    		}
    		updateObject();
    	}

        Object value = super.get(name,start);
		if(securityCheck && value != Scriptable.NOT_FOUND && (getAttributes(name) & ScriptableObject.DONTENUM) == ScriptableObject.DONTENUM)
			checkSecurity(this, PermissionLevel.WRITE_LEVEL.level);

        try {
			while (value instanceof TargetRetriever)
				value = ((TargetRetriever)value).getTarget();
		} catch (ObjectNotFoundException e) {
			value = null;
		}
        if (value instanceof Date) // TODO: Do we need to find a way to make this return the same date each time, I don't know if it is even possible with objects being collected
        	return ScriptRuntime.newObject(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), "Date", new Object[] {((Date)value).getTime()});
        else if(value instanceof Method)
    		((Method)value).setName(name);
        return value;
    }
    Object asTransactionValue(String name, Object oldValue, Object value) {
		if (oldValue instanceof TransactionValue){
			((TransactionValue)oldValue).setValue(this, name, value);
			value = oldValue;
		}
		else
			return new TransactionValue(this,name,oldValue,value);
		return value;
    }
    @Override
	public void put(int index, Scriptable start, Object obj) {
    	if(obj instanceof NativeFunction){
    		obj = new Method((BaseFunction)obj,"" + index);
    	}
    	if (id != null && id.source != null && (obj == null ? get(index,start) != null : !obj.equals(get(index,start)))) {
    		checkPut(index+"",obj,true);
    		obj = asTransactionValue(index + "",super.get(index,this),obj);
    	}
		super.put(index,start,obj);
		commitIfImmediate();
	}


	static void checkPut(Persistable obj, int index, Object value) {
		if(securityEnabled.get() != null){
			checkSecurity(obj, PermissionLevel.WRITE_LEVEL.level);
		}

    	enforceObjectChange(obj,"items", value, true);

	}

	public final static Object ADDITION = new Object();
	static int getAttributes(Persistable object, String key){
		try {
			return ((PersistableObject)object).getAttributes(Integer.parseInt(key));
		} catch (NumberFormatException e) {
			return ((PersistableObject)object).getAttributes(key);
		}
	}
	public static void commitPut(Entry<TransactionValue,ChangeUpdate> changeEntry, Transaction transaction) throws Exception {
		boolean wasSecurityEnabled = PersistableObject.isSecurityEnabled();
		// turn off security so no checks are made while we are persisting data
		try{
			PersistableObject.enableSecurity(false);
			TransactionValue transValue = changeEntry.getKey();
			ChangeUpdate change = changeEntry.getValue();
			Persistable target = change.target;
			Object value = transValue.values.get(transaction);
	    	Object sourceValue = value;
	    	Object oldValue = transValue.values.get(Transaction.OUTSIDE);
	    	boolean hadProperty = oldValue != Scriptable.NOT_FOUND;
	    	if (sourceValue instanceof PersistableObject) {
	    		sourceValue = ((PersistableObject) sourceValue).getId();
	    	}
	    	sourceValue = convertToDateJavaDate(sourceValue);
			Identification id = target.getId();
			if (id instanceof ObjectId && id.source != null) { // it should always be persisted right?
				if (change.key != null) {
					DataSource initialSource = id.source;
					WritableDataSource source;
					String subObjectId = id.subObjectId;
					if (subObjectId == null) {
						subObjectId = initialSource.getId();
						source = DataSourceManager.metaClassSource;
					}
					else {
						source = (WritableDataSource) initialSource;
					}
					Transaction.addAffectedSource(source);
					String key =change.key;

					if (hadProperty) {
						if (value == Scriptable.NOT_FOUND)
							source.recordPropertyRemoval(subObjectId, key);
						else
							source.recordPropertyChange(subObjectId, key, sourceValue, getAttributes(target, key));

					}
					else {

						source.recordPropertyAddition(subObjectId, key, sourceValue, getAttributes(target, key));
					}
				}
				else {
					Transaction.addAffectedSource((WritableDataSource)id.source);
					if (sourceValue == Scriptable.NOT_FOUND) {
						((WritableDataSource) id.source).recordDelete(id.subObjectId);
						((ObjectId)id).removeFromCache();
						// we can't do this or the data source won't know what the id of the object is
//						if(target instanceof PersistableObject)
	//						((PersistableObject) target).id = null; // at least remove the id in case it is accessed again
					}
					else
						((ListDataSource)id.source).recordList(id.subObjectId, (List)sourceValue);

				}
			}
			if(target instanceof PersistableObject)
				((PersistableObject)target).lastModified = Transaction.currentTransaction().getTransactionTime();
			else
				((PersistableArray)target).lastModified = Transaction.currentTransaction().getTransactionTime();
		}
		finally{
			PersistableObject.enableSecurity(wasSecurityEnabled);
		}
	}

	public Persistable getSchema() {
		return schema == null ?
				(id != null && id.source != null ?
						schema = ObjectId.idForObject(DataSourceManager.metaClassSource, id.source.getId()).getTarget() :
						null) :
					schema;
	}


	/**
	 *
	 * @param name
	 * @param obj
	 * @param alwaysPersist
	 * @return true if it should be persisted
	 */
	static Object enforceObjectChange(Persistable persistent, Object name, Object obj,boolean hadProperty) {
    	return PersistableClass.enforceSchemaForProperty(persistent.getSchema(),persistent, name,obj,hadProperty, false, hadProperty);
	}
    protected Object checkPut(String name, Object obj,boolean alwaysPersist) {
		if(securityEnabled.get() != null){
			checkSecurity(this, PermissionLevel.WRITE_LEVEL.level);
		}

    	boolean hadProperty = false;
    	try {
    		hadProperty = has(name,this);
    	}
    	catch (Exception e) {
    		e.printStackTrace();
    	}

    	return enforceObjectChange(this,name, obj, hadProperty);
    }

	@Override
	public void put(String name, Scriptable start, Object obj) {
    	if(obj instanceof NativeFunction){
    		obj = new Method((BaseFunction)obj,name);
    	}
    	if (id != null && id.source != null){// if it is a real persistent object
			if(start == this // only do this if we are at the end of the chain
				) {
	    		obj = checkPut(name,obj,false);
				if(id.isPersisted()){
		    		Object oldValue = super.get(name,start);
		    		if (oldValue instanceof TransactionValue){
		    			((TransactionValue)oldValue).setValue(this, name, obj);
		    			obj = oldValue;
		    		}
		    		else
		    			obj = new TransactionValue(this,name,oldValue,obj);
				}
			}
		}
		else{
			if("id".equals(name)){
				if(getId().isPersisted()){
					throw ScriptRuntime.constructError("TypeError", "Can not change the id of a persisted object");
				}
				getId().subObjectId = ScriptRuntime.toString(obj);
			}
		}

    	if(obj instanceof GetterSetterCombo){
    		setGetterOrSetter(name, 0, ((GetterSetterCombo)obj).getter, false);
    		setGetterOrSetter(name, 0, ((GetterSetterCombo)obj).setter, true);
    	}
    	else
    		super.put(name, start, obj);
    	if(name.charAt(0)==':') // this is how we can signify a dont-enum
    		setAttributes(name, ScriptableObject.DONTENUM);

		commitIfImmediate();
    }

    public Object set(String name, Object value) {
    	Object sourceValue = value;
    	if(value instanceof NativeFunction){
    		sourceValue = value = new Method((BaseFunction)value,name);
    	}
    	if(getPrototype() != null && ScriptableObject.hasProperty(getPrototype(), name) &&
    			ScriptableObject.getProperty(getPrototype(), name) instanceof Method
    			&& !(this instanceof SchemaObject)){
    		throw ScriptRuntime.constructError("TypeError", "Can not set a value in an instance property that overrides a method");
    	}

    	if (id != null && id.source != null){
    		Object oldValue = get(name,this);
    		if(oldValue == UniqueTag.NOT_FOUND)
    			oldValue = Undefined.instance;
    		if ((value== null ? oldValue != null : !ScriptRuntime.shallowEq(oldValue, value))) {
				value = checkPut(name,value,true);
				if(id.isPersisted())
					sourceValue = asTransactionValue(name,super.get(name,this),value);
	    	}
    	}else{
			if("id".equals(name)){
				if(getId().isPersisted()){
					throw ScriptRuntime.constructError("TypeError", "Can not change the id of a persisted object");
				}
				getId().subObjectId = ScriptRuntime.toString(value);
			}

    	}
    	try {
    		char firstChar = name.charAt(0);
    		if(firstChar <= '9' && firstChar >= '0') { // peformance guard
	    		int index = Integer.parseInt(name);
	    		super.put(index, this, sourceValue);
    		}
    		else{
    			super.put(name, this, sourceValue);
    		}
    	}
    	catch (NumberFormatException e) { // TODO: Maybe we should do a regex match so we dont' have to throw an exception
        	super.put(name, this, sourceValue);
    	}
    	commitIfImmediate();
		return value;
    }

	static void commitIfImmediate() {
		Transaction.currentTransaction().commitIfImmediate();
	}
    @Override
    public void delete(String name) {

    	if (id != null && id.source != null) {
    		if(securityEnabled.get() != null){
    			checkSecurity(this, PermissionLevel.WRITE_LEVEL.level);
    		}

        	boolean hadProperty = false;
        	try {
        		hadProperty = has(name,this);
        	}
        	catch (Exception e) {
        		e.printStackTrace();
        	}
        	enforceObjectChange(this,name, Scriptable.NOT_FOUND, hadProperty);
    		Object transValue = super.get(name,this);
    		if (transValue instanceof TransactionValue)
    			((TransactionValue)transValue).setValue(this, name, Scriptable.NOT_FOUND);
    		else
    			transValue = new TransactionValue(this,name,transValue, Scriptable.NOT_FOUND);
    		super.put(name, this, transValue);
    		//recordDelete(name);
    	}
    	else
    		super.delete(name);
//    	lastModified = getTransactionTime();
    }
    private void recordDelete(String name) {
    	try {
    		Identification id = getId();
			if (id instanceof ObjectId && id.source != null) {
				((WritableDataSource) id.source).recordPropertyRemoval(id.subObjectId, name);
			}
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

    }
    static Object convertToIdIfNeeded(Object object) {
    	if (object instanceof Persistable) {
    		// TODO: Handle the case of data object that is not a persistent object
    		return ((PersistableObject)object).getId();
    	}
    	return object;
    }

    protected void initializeProperty(String name, Object value) {
    	if(isSealed())
    		return;
    	if(value instanceof NativeFunction){
    		value = new Method((BaseFunction)value,name);
    	}

    	super.put(name, this, value);
    	if(name.charAt(0) == ':')
    		setAttributes(name, ScriptableObject.DONTENUM);
    }
/*    private static Scriptable getObjectPrototype() {
    	return ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object");
	}*/
    static private Scriptable arrayPrototype = null;
    private static Scriptable getArrayPrototype() {
    	return arrayPrototype == null ? arrayPrototype = ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Array") : arrayPrototype;
	}
    static private Scriptable queryPrototype = null;
    private static Scriptable getQueryPrototype() {
    	return queryPrototype == null ? queryPrototype = ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Query") : queryPrototype;
	}
    public static Object convertToDateJavaDate(Object value){
		if (value instanceof Scriptable && "Date".equals(((Scriptable)value).getClassName())) {
			// it is a date
			double time = (Double) ((Function) ScriptableObject.getProperty((Scriptable)value,"getTime")).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), (Scriptable)value, new Object[]{});
			value = new Date((long) time);
		}
		return value;

    }
    static void persistNewObject(final Persistable newObject,NewObjectPersister newObjectPersister) {
    	try {
			if (newObject instanceof List)
				newObjectPersister.initializeAsList((List) newObject);
			//Scriptable prototype = newObject.getPrototype();
//			if (prototype != null && prototype != getClassPrototype(GlobalData.getGlobalScope(), "Object")
//					&& prototype != getClassPrototype(GlobalData.getGlobalScope(), "Array")
//					&& !(newObject instanceof Function))
//				newObjectPersister.recordProperty(GlobalData.BASIS_FIELD, prototype);
			if (!(newObject instanceof PersistableClass))
				for (Map.Entry<String, Object> entry: newObject.entrySet(1))
					newObjectPersister.recordProperty(entry.getKey(), convertToDateJavaDate(entry.getValue()));

			setParent(newObject,newObjectPersister.getParent());
			newObjectPersister.finished();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
    }
    private static void setId(Persistable target, ObjectId id) {
    	if (target instanceof PersistableObject) {
	    	((PersistableObject)target).id = id;
    	}
    	else {
	    	((PersistableArray)target).id = id;

    	}
    }
    private static void setParent(Persistable target, ObjectId parent) {
    	if (target instanceof PersistableObject) {
			((PersistableObject)target).parent = parent;
    	}
    	else {
			((PersistableArray)target).parent = parent;
    	}
    }
    public static PersistableObject initObject(DataSource source) {
		PersistableObject result;
    	if(source == null){
			result = new PersistableObject();
    		ScriptRuntime.setObjectProtoAndParent((ScriptableObject) result, GlobalData.getGlobalScope());
    		return result;
    	}
		SourceInfo info = DataSourceManager.getObjectsClass(source);
		if (info.objectsClass !=null)
			try {
				result = (PersistableObject) info.objectsClass.newInstance();
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
		else
			result = new PersistableObject();
        ScriptRuntime.setObjectProtoAndParent((ScriptableObject) result, GlobalData.getGlobalScope());
        Scriptable proto = info.schema.getPrototypeProperty();
        if (proto != null)
        	result.setPrototype(proto);
        result.schema = info.schema;
        return result;
    }
    public static PersistableArray initArray(DataSource source) {
    	SourceInfo info = null;
    	//if (basis != null)
    		//clazz = Templates.getClassForObject(basis);
    	PersistableArray result;
    	if (source != null && (info = DataSourceManager.getObjectsClass(source)).objectsClass !=null &&
    			PersistableArray.class.isAssignableFrom(info.objectsClass))
    		try {
    			result =  (PersistableArray) info.objectsClass.getConstructor(Object[].class).newInstance(0);
    		} catch (Exception e) {
    			throw new RuntimeException(e);
    		}
    	else
    		result = new PersistableArray(0);
        ScriptRuntime.setObjectProtoAndParent((ScriptableObject) result, GlobalData.getGlobalScope());
        return result;
    }
    private boolean clearSlotsIfClean(){
		for(Object key : getIds()){
			if (super.get(key.toString(),this) instanceof TransactionValue)
				return false;
		}
/*		for(Object key : getIds()){ // technically we should be deleting keys in case an updated representation from the server has keys removed, but removing them here causes concurrency issues
			super.delete(key.toString());
		}*/
		return true;
    }
    public static void setVersion(Persistable object, Version version) {
		if(object instanceof PersistableObject)
			((PersistableObject)object).version = version;
		else
			((PersistableArray)object).version = version;

    }
    private static class PersistentInitializer implements PersistableInitializer {

		public void setLastModified(Date lastModified) {
			if(newObject instanceof PersistableObject)
				((PersistableObject)newObject).lastModified = lastModified;
			else
				((PersistableArray)newObject).lastModified = lastModified;
		}

		public void setVersion(Version version) {
			PersistableObject.setVersion(newObject, version);
		}
		Persistable newObject;
    	ObjectId id;
    	PersistentInitializer() {
    	}
    	PersistentInitializer(ObjectId id) {
    		this.id = id;
    		// reuse the existing object if it is available
    		if(id.targetRef != null)
    			newObject = id.targetRef.get();
    	}

		public void initializeList(Collection sourceCollection) {
			if(!(newObject instanceof PersistableList))
				newObject = initArray("".equals(id.subObjectId) ? null : id.source);
			if(sourceCollection != null)
				((PersistableList) newObject).initSourceCollection(sourceCollection);
			setId(newObject,id);
		}
/*		private Object handleChildObjectInitialize(Object value) {
			if (value instanceof ObjectWithInitialization) {
				ObjectId childId = ((ObjectWithInitialization)value).getId();
				try {
					DataObjectInitializer childInitializer = new PersistentInitializer(childId);
					((ObjectWithInitialization)value).mapObject(childInitializer);
					childId.targetRef = new SoftReference(childInitializer.getInitializingObject());
				} catch (Exception e) {
					throw new RuntimeException(e);
				}
				value = childId;
			}
			return value;
		}*/
		public void setProperty(String name, Object value, int attributes) {
			try {
				if (newObject == null) {
					newObject = initObject(id.source);
					setId(newObject,id);
				}
				((PersistableObject)newObject).initializeProperty(name,value);//handleChildObjectInitialize(value)
				if(value instanceof Persistable){
					if (((Persistable)value).getSchema() == null){
						Persistable schema = ((PersistableObject)newObject).getSchema();
						Object properties;
						if(schema != null){
							properties = schema.get("properties");
							if(properties instanceof Persistable){
								Object valueSchema = ((Persistable)properties).get(name);
								if(valueSchema instanceof Persistable){
									if(value instanceof PersistableObject)
										((PersistableObject)value).schema = (Persistable) valueSchema;
									else
										((PersistableArray)value).schema = (Persistable) valueSchema;
								}
							}
						}
					}
				}
				if(attributes != 0)
					((PersistableObject)newObject).setAttributes(name, attributes);
			} catch (RuntimeException e) {
				e.printStackTrace();
			}
		}
		public void setProperty(String name, Object value) {
			setProperty(name, value, 0);
		}

		public void setParent(ObjectId objectToInheritFrom) {
			if (newObject == null) {
				newObject = initObject(id.source);
				setId(newObject,id);
			}
    		if (objectToInheritFrom == id && !(newObject instanceof Acl))
    			return; //throw new RuntimeException("Can not set an acl id to be the same as the object id unless the object is an acl");
    		PersistableObject.setParent(newObject,objectToInheritFrom);
		}
		public Persistable getInitializingObject() {
			if (newObject == null){
				if(id.targetRef != null)
					newObject = id.targetRef.get();
				if (newObject == null)
					newObject = initObject(id.source);
			}
			setId(newObject,id);
			id.targetRef = new SoftReference<Persistable>(newObject);
			return newObject;
		}
		public void finished() {

		}
    };
    /**
     * @see DataSourceHelper.initializeObject()
     * @param id
     * @return
     */
    static PersistableInitializer initializeObject() {
    	return new PersistentInitializer();

    }
    /**
     * @see DataSourceHelper.initializeObject(id)
     * @param id
     * @return
     */
    static PersistableInitializer initializeObject(final ObjectId id) {
		PersistentInitializer initializer = new PersistentInitializer(id) {
    		@Override
			public void finished() {
    			getInitializingObject();
    		}
    	};
    	checkForExistingDirty(initializer);
    	return initializer;
    }
    public static boolean checkForExistingDirty(PersistableInitializer initializer){
    	PersistentInitializer init = (PersistentInitializer) initializer;
    	ObjectId id = init.id;
    	if(id.subObjectId != null && id.subObjectId.startsWith("s$"))
    		return true;
		if (id.targetRef != null){
			init.newObject = (Persistable) id.targetRef.get(); // in case it is already initialized
			if(init.newObject != null){
				if(init.newObject instanceof PersistableObject && !((PersistableObject)init.newObject).isSealed()){
					return !((PersistableObject)init.newObject).clearSlotsIfClean();
				}
			}
		}
		return false;
    }
    static Map<Persistable, Scriptable> schemasInstancesPrototype = new HashMap();;
    static Scriptable instancesPrototypeForSchema(Persistable schema) {
    	Object instancesPrototype = schemasInstancesPrototype.get(schema);
    	if (instancesPrototype == null) {
			instancesPrototype = schema.noCheckGet("instancesPrototype");
			Object superType = PersistableClass.getSuperType(schema);
			Scriptable nextPrototype = superType instanceof Persistable ? instancesPrototypeForSchema((Persistable) superType) :
				getQueryPrototype();
			if (instancesPrototype instanceof Persistable) {
				((Persistable) instancesPrototype).setPrototype(nextPrototype);
				schemasInstancesPrototype.put(schema, (Scriptable) instancesPrototype);
			}
			else {
				return nextPrototype;
			}
    	}
    	return (Scriptable) instancesPrototype;
    }
    static Persistable mapPersistent(final ObjectId id) {
    	PersistentInitializer initializer;

    	initializer = new PersistentInitializer(id);
    	if (checkForExistingDirty(initializer))
			//this means we are an existing dirty object , so we shouldn't update it
    		return initializer.newObject;
    	try {
        	if (id instanceof Query){
        		Collection queryResults = id.source.query((Query)id);
        		if(queryResults instanceof List){
        			initializer.newObject = new QueryArray(queryResults);
        			initializer.newObject.setPrototype(instancesPrototypeForSchema(
        					DataSourceManager.getObjectsClass(id.source).schema));
        		}
        		else
        			initializer.initializeList(queryResults);
/*        		Object superType = PersistableClass.getSuperType(ObjectId.idForObject(DataSourceManager.metaClassSource, id.source.getId()).getTarget());
        		if(superType instanceof Persistable)
        			initializer.setParent(ObjectId.idForString(((Persistable)superType).getId().subObjectId + "/"));
        		else*/
        			initializer.setParent(DataSourceManager.getRootObject().getId());
        	}
        	else {
    			id.source.mapObject(initializer,id.subObjectId);
        	}
    	} catch (QueryCantBeHandled qe) {
    		throw qe;
    	} catch(ObjectNotFoundException oe) {
    		throw oe;
		} catch (Exception e) {
			//e.printStackTrace();
			Persistable newObject = initializer.getInitializingObject();
			setId(newObject,null); // do this so we can set the error without trying to persist it
			if(newObject instanceof PersistableObject)
				((PersistableObject)newObject).initializeProperty("error", e.toString());
			else
				((PersistableArray)newObject).add(e.toString());
			setId(newObject,id);
		}
		Persistable newObject = initializer.getInitializingObject();
    	if(newObject instanceof PersistableObject){
    		((PersistableObject)newObject).lastUpdated = System.currentTimeMillis();
    	} else if(newObject instanceof PersistableArray){
    		((PersistableArray)newObject).lastUpdated = System.currentTimeMillis();
    	}
        return newObject;
    }
 /*   static class PropertyChangeContext {
    	User user;
    	PropertyChangeListener listener;
    	Map<String, Map<String,
		public PropertyChangeContext(User user, PropertyChangeListener listener) {
			super();
			this.user = user;
			this.listener = listener;
		}
		@Override
		public boolean equals(Object obj) {
			return listener.equals(obj);
		}
		@Override
		public int hashCode() {
			return listener.hashCode();
		}
    }*/
    static Map<PropertyChangeSetListener,Map<ObjectId, Set<String>>> watchSets = new WeakHashMap<PropertyChangeSetListener,Map<ObjectId, Set<String>>>();
    static InheritableThreadLocal<Map<ObjectId, Set<String>>> readSets = new InheritableThreadLocal<Map<ObjectId,Set<String>>>();
    public static Map<ObjectId, Set<String>> startReadSet() {
    	Map<ObjectId, Set<String>> readSet;
		readSets.set(readSet = new HashMap<ObjectId, Set<String>>());//readSets.get()
    	return readSet;
    }
    public static Map<ObjectId, Set<String>> getReadSet() {
    	return readSets.get();
    }
	/**
	 * This is used to listen for changes in an object that have been read in this transaction. You MUST keep a reference
	 * to the listener as long as you wish the it to listen. Once the listener doesn't have a reference
	 * it can be reclaimed and it will no longer listen.
	 * @param listener
	 * @return
	 */
    public static void addListener(PropertyChangeSetListener listener) {
        Map<ObjectId, Set<String>> readSet = readSets.get();
		Map<ObjectId, Set<String>> watchSet = watchSets.get(listener);
		if (watchSet == null) {
			synchronized (watchSets) {
				watchSets.put(listener,
						watchSet = new HashMap<ObjectId, Set<String>>());
			}
		}
		for (Map.Entry<ObjectId, Set<String>> entry : readSet.entrySet()) {
			ObjectId key = entry.getKey();
			Set<String> value = entry.getValue();
			if (watchSet.containsKey(key) && value != FullSet.instance)
				watchSet.get(key).addAll(value);
			else {
				if (watchSet.containsKey(key) && key instanceof Query
						&& ((Query) key).conditionFunction != null) {

					ObjectId oldQuery = null;
					// find the old query (and it's conditionFunction)
					for (Map.Entry<ObjectId, Set<String>> watchEntry : watchSet
							.entrySet()) {
						oldQuery = watchEntry.getKey();
						if (oldQuery.equals(key)) {
							break;
						}
					}
					final Function newFunction = ((Query) key).conditionFunction;
					final Function oldFunction = ((Query) oldQuery).conditionFunction;
					if (oldFunction != null) {
						// create a new function that combines the other two
						((Query) oldQuery).conditionFunction = new BaseFunction() {
							public Object call(org.mozilla.javascript.Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
								return ScriptRuntime.toBoolean(newFunction.call(cx,	scope, thisObj, args)) ||
									ScriptRuntime.toBoolean(oldFunction.call(cx, scope, thisObj, args));
							}
						};
					}
				}
				watchSet.put(key, value);
			}
		}
    }
    public static void removeListener(PropertyChangeListener listener) {
		synchronized(watchSets){
			watchSets.remove(listener);
		}
    }
    /**
     * Stops listening for the
     * @param listener
     */
    public static Map<ObjectId, Set<String>> getWatchSet(PropertyChangeSetListener listener) {
    	return watchSets.get(listener);
    }





	public static void resetComputedPermissions() {
		computedPermissions = new WeakHashMap<Principal, Map<Persistable,PermissionLevel>>();
	}
    protected static Map<Principal,Map<Persistable,PermissionLevel>> computedPermissions = new WeakHashMap<Principal, Map<Persistable,PermissionLevel>>();
    static class PermissionChangeListener implements PropertyChangeSetListener {
		public void propertyChange(List<ObservedCall> evts) {
			resetComputedPermissions();
		}
    }

	public static Map<String,PermissionLevel> permissionNames = new HashMap<String,PermissionLevel>();

    public int getAccessLevel() {
    	return checkSecurity(this,-1);
    }
    public static final int BROWSE = 0;  // TODO: These constants should be combined with PermissionLevel
    public static final int LIMITED = 1;
    public static final int READ = 2;
    public static final int WRITE = 5;
    public static final int EXECUTE = 3;
    public static final int APPEND = 4;
    public static final int ACCESS_PERMISSION_LEVEL = 6;

    // cached public permission for maximum speed
    //int universalPermissionLevel = -1;
    public static int checkSecurity(Persistable data,int level) {
/*    	if (level != -1 && data.getUniversalPermissionLevel() >= level)
    		return data.getUniversalPermissionLevel();
/*    	Acl acl = data.getAcl();
        if (acl == null) // indicates it is transient
        	return 5;
    	// TODO: Pass in the permission level required and then do logic short-circuits if the permission level is found
    	if (data.getUniversalPermissionLevel() == -1){
    		User publicUser = UserSecurity.getPublicUser();
    		if (publicUser != null)
    			data.setUniversalPermissionLevel(publicUser.getPermissionLevel(data).level);
    	}*/
    	if(!data.getId().isPersisted())
    		return 5;

        int permissionLevel = UserSecurity.getPermissionLevel(data);
        if (permissionLevel < level) {
        	String message;
	        if (level == BROWSE || level == LIMITED)
	        	message = "Access denied to " + data + " you do not have any permission";
	        else if (level == READ)
	        	message = "Access denied to " + data + " you do not have read permission";
	        else if (level == WRITE)
	        	message = "Writing to " + data + " is not permitted, you do not have write permission";
	        else if (level == EXECUTE)
	            message = "Executing a method on " + data + " is not permitted, you do not have execute permission";
	        else if (level == APPEND)
	            message = "Appending to " + data + " is not permitted, you do not have append permission";
	        else if (level == ACCESS_PERMISSION_LEVEL)
	            message = "Deleting " + data + " is not permitted, you do not have delete permission";
	        else
	        	message = "Unknown security exception";

        	throw ScriptRuntime.constructError("AccessError",message);
        }
        return permissionLevel;
    }




	public Object get(int index) {
		return get(index,this);
	}
	@Override
	public Object get(int index, Scriptable start) {
    	if (id != null && id.source != null) {
    		if(securityEnabled.get() != null){
    			checkSecurity(this, PermissionLevel.READ_LEVEL.level);
    		}

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


     public Date getLastModified() {
    	 //TODO: Need to implement this with the new history system
		return lastModified;
	}
    Date lastModified = new Date();
    public static final int ENTRY_SET_INCLUDE_DONT_ENUM = 1;
    public static final int ENTRY_SET_INCLUDE_GETTER_SETTER_FUNCTIONS = 2;
    public static final int ENTRY_SET_USE_CORE_VALUES = 4;
    class GetterSetterCombo {
    	Function getter;
    	Function setter;
    }
    Object getPreGetterSetterValue(String name, int index){
    	Object getter = getGetterOrSetter(name, index, false);
    	Object setter = getGetterOrSetter(name, index, false);
    	if (getter instanceof Function || setter instanceof Function){
    		GetterSetterCombo value = new GetterSetterCombo();
    		value.getter = (Function) (getter instanceof Function ? getter : null);
    		value.setter = (Function) (setter instanceof Function ? setter : null);
    	}
    	if(name == null)
    		return get(index, this);
    	return get(name, this);
    }
    static private class EntrySet extends AbstractSet<Map.Entry<String,Object>>{
    	Object[] ids;
    	Scriptable object;
    	boolean useCoreValues;
    	boolean includeGettersSetters;
    	EntrySet(Object[] ids, Scriptable object, boolean useCoreValues, boolean includeGettersAndSetters){
    		this.ids = ids;
    		this.object = object;
    		this.useCoreValues = useCoreValues && object instanceof PersistableObject;
    		this.includeGettersSetters = includeGettersAndSetters && object instanceof PersistableObject;
    	}
		@Override
		public Iterator iterator() {
			return new Iterator(){
				int i = 0;
				Object nextValue = getNextValue();
				String nextKey;
			    public boolean hasNext(){
			    	return nextValue != Scriptable.NOT_FOUND;
			    }
			    Object getNextValue(){
		    		do{
			    		nextValue = ids.length > i ? (useCoreValues ? ((PersistableObject)object).getCoreValue(ids[i].toString()) :
			    			includeGettersSetters ? ((PersistableObject)object).getPreGetterSetterValue(ids[i] instanceof String ? (String) ids[i] : null, ids[i] instanceof Number ? ((Number)ids[i]).intValue() : 0) :
			    			object.get(ids[i].toString(), object)) : Scriptable.NOT_FOUND;
			    		nextKey = ids.length > i ? ids[i].toString() : null;
			    		i++;
			    	}
		    		while(ids.length > i && nextValue == Scriptable.NOT_FOUND);
		    		return nextValue;
			    }
			    public Map.Entry<String,Object> next(){
		    		final String name = nextKey;
		    		final Object value = nextValue;
		    		getNextValue();
			    	return new Map.Entry<String,Object>(){
			    		public String getKey(){
			    			return name;
			    		}
			    		public Object getValue(){
			    			return value;
			    		}
			    		public Object setValue(Object obj){
			    			throw new UnsupportedOperationException();
			    		}

			    	};
			    }
			    public void remove(){
			    	throw new UnsupportedOperationException();
			    }

			};
		}

		@Override
		public int size() {
			return ids.length;
		}

    }
    static public Set<Map.Entry<String, Object>> entrySet(ScriptableObject target, int options){
    	PersevereContextFactory.getContext();
    	return new EntrySet(
    			((ENTRY_SET_INCLUDE_DONT_ENUM & options) == ENTRY_SET_INCLUDE_DONT_ENUM) ? target.getAllIds() : target.getIds(),
    			target,
    			((ENTRY_SET_USE_CORE_VALUES & options) == ENTRY_SET_USE_CORE_VALUES),
    			((ENTRY_SET_INCLUDE_GETTER_SETTER_FUNCTIONS & options) == ENTRY_SET_INCLUDE_GETTER_SETTER_FUNCTIONS));
    }
    public Set<Map.Entry<String, Object>> entrySet(int options){
    	if (id != null && id.source != null) {
    		if(securityEnabled.get() != null){
    			checkSecurity(this, PermissionLevel.READ_LEVEL.level);
    		}
    	}
    	return new EntrySet(
    			((ENTRY_SET_INCLUDE_DONT_ENUM & options) == ENTRY_SET_INCLUDE_DONT_ENUM) ? getAllIds() : getIds(),
    			this,
    			((ENTRY_SET_USE_CORE_VALUES & options) == ENTRY_SET_USE_CORE_VALUES),
    			((ENTRY_SET_INCLUDE_GETTER_SETTER_FUNCTIONS & options) == ENTRY_SET_INCLUDE_GETTER_SETTER_FUNCTIONS));
    }
	public Set<String> keySet(boolean includeDontEnum) {
		Object[] ids = includeDontEnum ? getAllIds() : getIds();
		Set<String> keySet = new HashSet();
		for (Object key : ids)
				keySet.add(key.toString());
		return keySet;
	}
	public void subscribe() {
    	if (id != null && id.source != null) {
    		if(securityEnabled.get() != null){
    			checkSecurity(this, PermissionLevel.READ_LEVEL.level);
    		}
        	Map<ObjectId, Set<String>> readSet = readSets.get();
        	if (readSet != null) {
        		readSet.put(id, FullSet.instance);
        	}
    	}
	}
    @Override
	public Object[] getIds() {
/*    	if (id != null && id.source != null) {
    		recordObjectRead();
    	}*/
		return super.getIds();
	}
	@Override
	public String toString() {
    	return getId().isPersisted() ? getId().toString() : super.toString();
    }
/*    private long getLengthProperty() {
        // These will both give numeric lengths within Uint32 range.
    	if (id != null && id.source != null && id.isPersisted())
    		recordObjectRead();*
        if (this instanceof PersistentList)
            return ((PersistentList)this).getLength();
        Object length = ScriptRuntime.getObjectProp(this, "length", PersevereContextFactory.getContext());
        if (length instanceof Number)
        	return ScriptRuntime.toUint32(length);
        return 0;
    }*/
	public void delete() {
		if(PersistableObject.securityEnabled.get() != null){
			PersistableObject.checkSecurity(this, PermissionLevel.FULL_LEVEL.level);
		}
		// TODO: The reference cleanup is not transactionally isolated
		if(id.source instanceof ReferenceAwareDataSource){
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
		asTransactionValue(null, this, Scriptable.NOT_FOUND);
	}
	public Persistable getParent() {
		if(parent == this){
			throw new RuntimeException("circular loop in parents");
		}
		return (Persistable) (parent instanceof Persistable ? parent :
					parent instanceof Query ? parent = ((Query)parent).getCachedTarget() :
					parent instanceof ObjectId ? parent = ((ObjectId) parent).getTarget() :
					id != null && id.source != null ?
								parent = ((Query) ObjectId.idForObject(id.source, "")).getCachedTarget() :
						null);

	}

    public static class FullSet implements Set<String> {
    	public final static FullSet instance = new FullSet();
		public boolean add(String e) {
			return true;
		}

		public boolean addAll(Collection c) {
			return true;
		}

		public void clear() {
		}

		public boolean contains(Object o) {
			return true;
		}

		public boolean containsAll(Collection c) {
			return true;
		}

		public boolean isEmpty() {
			return false;
		}

		public Iterator iterator() {
			return null;
		}

		public boolean remove(Object o) {
			return false;
		}

		public boolean removeAll(Collection c) {
			return false;
		}

		public boolean retainAll(Collection c) {
			return false;
		}

		public int size() {
			return 0;
		}

		public Object[] toArray() {
			return null;
		}

		public Object[] toArray(Object[] a) {
			return null;
		}

    }
	public void onCreation() {
		// do nothing
	}
	/*public int getUniversalPermissionLevel() {
		return universalPermissionLevel;
	}
	public void setUniversalPermissionLevel(int universalPermissionLevel) {
		this.universalPermissionLevel = universalPermissionLevel;
	}*/
	Version version;
	public Version getVersion() {
		return version;
	}

}
