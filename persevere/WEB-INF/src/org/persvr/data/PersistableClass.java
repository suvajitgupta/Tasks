package org.persvr.data;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Callable;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.UserAssignableIdSource;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.security.PermissionLevel;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;

public class PersistableClass extends PersistableObject implements Function {
	public boolean persist = true;
	public static ThreadLocal<Boolean> persistClass = new ThreadLocal<Boolean>(); 
	public PersistableClass(){
		persist = persistClass.get() == null ? true : persistClass.get(); 
		if(realObject != null) {
			realObject.parent = this;
/*			Scriptable collectionObject = new PersistableObject();
			realObject.noCheckSet("collection",collectionObject);
			collectionObject.put("items", collectionObject, this);*/
			
		}
	}
	final static ScriptableObject objectProto = (ScriptableObject) ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Object");
	// run construction on a newly created object
	public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		return instantiate(cx, scope, args, false);
	}

	public Scriptable instantiate(Context cx, Scriptable scope, Object[] args, boolean construct) {
		String className = getId().subObjectId;

		Persistable newObject = null;
		boolean unpersistedClass = false;
		if(!construct && "Class".equals(className) && args.length > 0 && args[0] instanceof Persistable){
			// if it is a class, we have special behavior to handle it so we can create classes in jslib files
			Object newClassName = ((Persistable)args[0]).get("id");
			if(newClassName instanceof String && !((String)newClassName).startsWith("s$")){
				try{
					unpersistedClass = true;
					newObject = ObjectId.idForObject(DataSourceManager.getMetaClassSource(), (String) newClassName).getTarget();
					// if we found an existing class, we will clear it out so it can be recreated
					for(Map.Entry<String, Object> entry : newObject.entrySet(PersistableObject.ENTRY_SET_INCLUDE_DONT_ENUM)){
						String key = entry.getKey();
						if(!key.equals("instances") && !key.equals("prototype"))
							newObject.delete(entry.getKey());
					}
				} catch(ObjectNotFoundException e){
					// do nothing, leave newObject as null
				}
			}
			else{
				throw new RuntimeException("No class id provided in class definition");
			}
		}
		if(newObject	== null)
			newObject = Persevere.newObject(DataSourceManager.getSource(getId().subObjectId));
		if(unpersistedClass){
			// we can't do this yet because the JavaScriptDB relies on everything be declared before it is initialized
			//((PersistableClass)newObject).persist = false;
		}
		return assignId(doConstruction(cx, scope, newObject, args, true));
	}
	public Scriptable assignId(Scriptable newObject){
		ObjectId objId = ((Persistable)newObject).getId();
		if(objId instanceof NewObjectId && !objId.isPersisted()){
			String id = objId.subObjectId;
			DataSource source = DataSourceManager.getSource(this.id.subObjectId);
			if(source instanceof UserAssignableIdSource && newObject instanceof PersistableObject){
				if(id.startsWith("s$")){
					id = ((UserAssignableIdSource)source).newId();
				}
				else {
					if(!((UserAssignableIdSource)source).isIdAssignable((String) id))
						throw ScriptRuntime.constructError("ReferenceError", "Can not assign the id " + id + ", id is reserved. Use setIdSequence to increase the id to value above user assigned ids");
				}
				
				((NewObjectId) objId).assignId(source, (String) id, false);
				 
			}
		}
		if(newObject instanceof PersistableClass){
			// put it in on the global right away instead of waiting for a commit
			Scriptable global = GlobalData.getGlobalScope();
			global.put(objId.subObjectId, global, newObject);
		}
		return newObject;
		
	}
	public Scriptable doConstruction(Context cx, Scriptable scope, Persistable props, Object[] args) {
		return assignId(doConstruction(cx, scope, props, args, true));
	}
	public Scriptable doConstruction(Context cx, Scriptable scope, Persistable newObject, Object[] args, boolean callDefaultInitializer) {
		Object properties = get("properties", this);
		// set the default values first, with the subclass taking precedence
		if(properties instanceof Persistable){
			for(Map.Entry<String,Object> entry : ((Persistable)properties).entrySet(2)){
				if(entry.getValue() instanceof Persistable && newObject.get(entry.getKey(), newObject) == Scriptable.NOT_FOUND){
					Object defaultValue = ((Persistable)entry.getValue()).get("default");
					if(defaultValue != Scriptable.NOT_FOUND)
						newObject.put(entry.getKey(), newObject, defaultValue);	
				}
				
			}
		}
		Object superType = getSuperType(this);
		Scriptable prototype = getPrototypeProperty();
		Object constructor = prototype.get("initialize", prototype);
		if(constructor instanceof Function)
			callDefaultInitializer = false;
		// call the super constructor first if we can
		if(superType instanceof PersistableClass){
			((PersistableClass)superType).doConstruction(cx, scope, newObject, args, callDefaultInitializer);
		}else{
			// we have traversed the extends chain, copy props from the first param
			if(callDefaultInitializer && args.length > 0 && args[0] instanceof Persistable){
				for(Map.Entry<String,Object> entry : ((Persistable)args[0]).entrySet(2)){
					newObject.put(entry.getKey(), newObject, entry.getValue());
				}
			}
		}
		// try to call the initialize function if available
		if(constructor instanceof Function)
			((Function)constructor).call(cx, scope, newObject, args);
		return newObject;
	}
	final static Scriptable globalScope = GlobalData.getGlobalScope();
	final static Scriptable objectPrototype = ScriptableObject.getObjectPrototype(GlobalData.getGlobalScope());
	final static Scriptable arrayPrototype = ScriptableObject.getClassPrototype(GlobalData.getGlobalScope(),"Array");

	public static PersistableClass Object;
	public static PersistableClass Array;
	// create a new object when the constructor is called
	public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
		if(this == Object){
			ScriptableObject newObject = new PersistableObject();
			newObject.setParentScope(globalScope);
			newObject.setPrototype(objectPrototype);
			return newObject;
		}
		if(this == Array){
			ScriptableObject newObject;
			if(args.length == 0)
				newObject = new PersistableArray(0);
			else if(args.length == 1)
				newObject = new PersistableArray(((Number)args[0]).longValue());
			else
				newObject = new PersistableArray(args);
			newObject.setParentScope(globalScope);
			newObject.setPrototype(arrayPrototype);
			return newObject;
		}
		return instantiate(cx, scope, args, true);
	}
	@Override
	public String getClassName() {
		return "Class";
	}
	Scriptable prototypeProperty;
	static PersistableObject nextRealObject; 
	PersistableObject realObject = nextRealObject == null ? new PersistableObject() : nextRealObject;
	boolean permanentRealObject = nextRealObject != null;
	/**
	 * get the prototype property
	 * @return
	 */
	public Scriptable getPrototypeProperty() {
		if (prototypeProperty == null) {
			prototypeProperty = new SchemaObject();
			ScriptRuntime.setObjectProtoAndParent((ScriptableObject) prototypeProperty, GlobalData.getGlobalScope());
			noCheckSet("prototype", asTransactionValue("prototype", NOT_FOUND, prototypeProperty));
			commitIfImmediate();
		}
		Object superType = getSuperType(this);
		if (superType instanceof PersistableClass) { // setup the prototype chain correctly
			prototypeProperty.setPrototype(((PersistableClass) superType).getPrototypeProperty());
		}
		return prototypeProperty;
	}
	@Override
	public Object set(String name, Object value) {
		if (name.equals("prototype")){
			throw new RuntimeException("Can not set the prototype property to a different value, you must modify the current prototype object");
		}
		if (value instanceof PersistableClass) {
			checkPut(name,value,true);
			initializeProperty(name, value);
			return value;
		}
		else {
			return realObject.set(name,value);
		}
	}
	private void addAbstractMethods(){
		Object methods = get("methods");
		if (methods instanceof Persistable) {
			for(Map.Entry<String,Object> entry : ((Persistable)methods).entrySet(0)){
				final String name = entry.getKey();
				if (!ScriptableObject.hasProperty(prototypeProperty, name)){
					prototypeProperty.put(name, prototypeProperty, new Method(new PersevereNativeFunction(){
						@Override
						public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
							throw ScriptRuntime.constructError("TypeError", "The method " + name + " has a definition but does not have an implementation on the prototype object");
						}
						@Override
						public Object get(String name, Scriptable start) {
							if ("toString".equals(name)) {
								return new PersevereNativeFunction(){
									public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
										return "function(){\n\tthrow new TypeError(\"The method has a definition but does not have an implementation on the prototype object\")\n}";
									}
								};
							}
							return super.get(name, start);
						}
					}, name));
				}
			}
		}
		
	}
	@Override
	protected void initializeProperty(String name, Object value) {
		if ("prototype".equals(name)) {
			if (value instanceof ObjectId) {
				value = ((ObjectId)value).getTarget();
			}
			prototypeProperty = (Scriptable) value;
			addAbstractMethods();
			if(value instanceof PersistableObject) {
				((PersistableObject)value).initializeProperty(":prototypeOf", this);
			}
			if (!(value instanceof Persistable))
				return; // don't set it in the slots if it is the NativeObject or NativeArray
		}
		if("extends".equals(name)){
			Object superType = get("extends");
			if(superType instanceof PersistableClass) 
				((PersistableClass)superType).subTypes.remove(this);
			if(value != null){
				if(value instanceof ObjectId){
					value = ((ObjectId)value).getTarget();
				}
				if(value instanceof Scriptable && !id.subObjectId.equals("Class"))
					setPrototype((Scriptable) value);

				if(value instanceof PersistableClass)
					((PersistableClass)value).subTypes.add(this);
			}
			
		}
		realObject.initializeProperty(name, value);
	}
	Set<PersistableClass> subTypes = new HashSet<PersistableClass>();
	public Set<PersistableClass> getSubTypes(){
		return subTypes;
	}
	public void setPrototypeProperty(Scriptable prototypeProperty) {
		initializeProperty("prototype",prototypeProperty);
	}
	@Override
	public Persistable getParent() {
		return DataSourceManager.getRootObject() == this ? null : (Persistable) DataSourceManager.getRootObject().get("instances");
	}
	/**
	 * Does the initial setup of a schema on startup
	 * @param rootSchema
	 */
	public static void setupSchema(PersistableClass rootSchema) {
		Scriptable pjsLibrary = (Scriptable) GlobalData.getGlobalScope().get("pjs",GlobalData.getGlobalScope());
		//TODO: move eval into PjsLibrary class
		pjsLibrary.put("eval", pjsLibrary, new PersevereNativeFunction() {
			@Override
			public Object call(final Context cx, final Scriptable scope,
					final Scriptable thisObj, Object[] args) {
				if (!UserSecurity.hasPermission(SystemPermission.javaScriptCoding))
					throw new SecurityException("User is not permitted to execute code on the server");
				return cx.evaluateString(GlobalData.getGlobalScope(), (String) args[0], "console", 0, null);
			}			
		});
		BaseFunction putHandler = new PersevereNativeFunction() {
			@Override
			public Object call(final Context cx, final Scriptable scope,
					final Scriptable thisObj, Object[] args) {
				// check to make sure all the objects are valid after a schema change
				// TODO: The performance of this could be greatly improved with more information from the put
				PersistableClass schema = (PersistableClass) thisObj;
				if (schema != null) {
					Object propertiesDefinitions = schema.get("properties");
					if (propertiesDefinitions instanceof Persistable && schema.getPrototypeProperty() instanceof Persistable) {
						Persistable prototype = (Persistable) schema.getPrototypeProperty();
							for (Object key : prototype.getIds())
								if (key instanceof String)
									enforceSchemaForProperty(schema, prototype, (String) key, prototype.get((String) key), true, true, false);
							List<Persistable> instances = (List) schema.get("instances");
							Object[] propertyIds = ((Persistable)propertiesDefinitions).getIds();
							List<String> stringList = new ArrayList();
							for (Object property : propertyIds){
								if (property instanceof String)
									stringList.add((String) property);
							}
							String[] stringKeys = new String[stringList.size()];
							stringList.toArray(stringKeys);
							for (String key : stringKeys) {
								Object propertyDef = ((Persistable)propertiesDefinitions).get(key);
								//TODO: Allow it to point to another a schema's properties object
								if (propertyDef instanceof Persistable && !(propertyDef instanceof PersistableClass)) {
									if (((Persistable)propertyDef).get("properties") instanceof Persistable)
										throw new RuntimeException("Can not create an object validator that does not reference an existing schema"); 
								}
							}
							if(Boolean.TRUE.equals(schema.get("checkAllInstancesOnSchemaChange", schema))) {
								for (Persistable instance : instances){
									for (String key : stringKeys) {
										enforceSchemaForProperty(schema, instance, key, ScriptableObject.getProperty(instance, key), true, true, false);
									}
								}
							}
					}
				}
				return true;
		    }
			public String toString() {
				return "function(resource){/*native code*/}";
			}
		};
		putHandler.put("source", putHandler, "function(){[Native code]}");
		pjsLibrary.put("putHandler", pjsLibrary, putHandler);
		putHandler.setPrototype(ScriptableObject.getFunctionPrototype(GlobalData.getGlobalScope()));
	}
	static void validationError(String message){
		throw ScriptRuntime.constructError("TypeError",message);
	}
	static EcmaError addPropertyToValidationError(EcmaError e, String property){		
		return ScriptRuntime.constructError("TypeError",e.getErrorMessage() + " for " + property);
	}
	/**
	 * Schema type checking for primitive values
	 * @param typeObj
	 * @param obj
	 */
	static void enforcePrimitive(Object typeObj, Object obj) {
		if (typeObj instanceof String) {
			String requiredType = (String)typeObj;
			if (!requiredType.equals("any")) {
				String type;
				if (obj == null)
					type = "null";
				else if (obj instanceof String || obj instanceof Date || ((obj instanceof IdScriptableObject) && ((Scriptable)obj).getClassName().equals("Date")))
					type = "string";
				else if (obj instanceof Number){
					type = "number";
					if (requiredType.equals("integer")) {
						if(obj instanceof Integer || obj instanceof Byte || obj instanceof Long || 
								(obj instanceof Number && ((Number)obj).doubleValue() % 1 == 0)){
							// check to see if it is actually an integer, if that is what is required
							type = "integer";
						}
					}
				}
				else if (obj instanceof Boolean)
					type = "boolean";
				else if (obj instanceof Function)
					type = "function";
				else if (obj instanceof List)
					type = "array";
				else
					type = "object";
				if (!type.equals(requiredType))
					validationError("A " + type + " is not allowed, a " + requiredType + " is required");
			}
		}
		
		else if (typeObj instanceof List) {
			boolean validFound = false;
			for (Object unionObj : (List)typeObj){
				try {
					enforcePrimitive(unionObj, obj);
					validFound = true;
					break;
				}
				catch (EcmaError e) {
					
				}
			}
			if (!validFound) {
				validationError("Value not valid for any type in the union");
			}
		}
		else if (typeObj instanceof Scriptable){
			enforceSchemaForValue((Scriptable) typeObj, obj);
		}

	}
	/**
	 * Ensures that a value is valid by a schema by coercion if necessary
	 * @param schema
	 * @param object
	 * @param name
	 * @param value
	 * @return
	 */
	static Object coerceValueForSchema(Scriptable schema, Persistable object, Object name, Object value){
		if (value == Undefined.instance || value == Scriptable.NOT_FOUND) 
			if (Boolean.TRUE.equals(schema.get("optional", schema)))
				return value;
		if (schema instanceof PersistableClass) {
			if (value instanceof Persistable) {
				Scriptable classProto = ((PersistableClass) schema).getPrototypeProperty();
				Scriptable proto = ((Persistable)value).getPrototype();
				do {
					if (proto == classProto)
						return value;
					proto = proto.getPrototype();
				} while (proto != null);
				return value = ((PersistableClass)schema).construct(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), new Object[]{value});
			}
			object.set((String) name, null);
		} else {
			Object typeObj = schema.get("type" ,schema);
			try{
				enforcePrimitive(typeObj,value);
				typeObj = null;
			}
			catch(EcmaError e){
				if(typeObj instanceof List){
					typeObj = ((List)typeObj).get(0);
				}
				if(typeObj instanceof String){
					if("object".equals(typeObj)){
						object.put((String) name,object,value = Persevere.newObject());
					}
					else if("array".equals(typeObj)){
						object.put((String) name,object,value = Persevere.newArray());
					}
					else if("string".equals(typeObj)){
						object.put((String) name,object,value = ScriptRuntime.toString(value));
					}
					else if("number".equals(typeObj)){
						try {
							object.put((String) name,object,value = ScriptRuntime.toNumber(value));
						}
						catch (EcmaError e2){
							object.put((String) name,object,value = ScriptRuntime.NaN);
						}
					}
					else if("integer".equals(typeObj)){
						try{
						object.put((String) name,object,value = ScriptRuntime.toInteger(value));
						}
						catch (EcmaError e2){
							object.put((String) name,object,value = ScriptRuntime.NaN);
						}
					}
					else if("boolean".equals(typeObj)){
						object.put((String) name,object,value = ScriptRuntime.toBoolean(value));
					}
					else if("null".equals(typeObj)){
						object.put((String) name,object,value = null);
					}
				}
			}
			
			if (value instanceof Number && (typeObj = schema.get("minimum", schema)) instanceof Number)
				if (((Number)value).doubleValue() < ((Number)typeObj).doubleValue())
					object.put((String) name,object,schema.get("minimum", schema));
			if (value instanceof Number && (typeObj = schema.get("maximum", schema)) instanceof Number)
				if (((Number)value).doubleValue() > ((Number)typeObj).doubleValue())
					object.put((String) name,object,schema.get("maximum", schema));
			if (value instanceof String && (typeObj = schema.get("maxLength", schema)) instanceof Number)
				if (((String)value).length() > ((Number)typeObj).intValue())
					object.put((String) name,object,((String)value).substring(0,((Number) schema.get("maxLength", schema)).intValue()));
			if (value instanceof List && (typeObj = schema.get("maxItems", schema)) instanceof Number)
				if (((List)value).size() > ((Number)typeObj).intValue())
					((Scriptable)value).put("length",(Scriptable)value,((Number)typeObj).intValue());
			if ((typeObj = schema.get("enum", schema)) instanceof List){
				boolean found = false;
				for (Object item : (List)schema.get("enum", schema)){
					if (item.equals(value)){
						found = true;
						break;
					}
				}
				if (!found)
					object.put((String) name,object,((List)schema.get("enum", schema)).get(0));
			}
		}
		Object superType = getSuperType(schema);
		if (superType instanceof Persistable){
			// first check to see if we are valid by the super type
			value = coerceValueForSchema((Persistable) superType, object, name, value);
		}
		return value;
	
	}
	static Object getSuperType(Scriptable schema){
		return schema instanceof Persistable ? 
			((Persistable)schema).noCheckGet("extends") : schema.get("extends", schema);
	}
	/**
	 * Enforces the schema on a particular property
	 * @param schema
	 * @param object
	 * @param name
	 * @param value
	 * @param alwaysPersist
	 * @param hadProperty
	 * @param coerce
	 * @param changing
	 * @return
	 */
	static Object enforceSchemaForProperty(Persistable schema, Persistable object, Object name, Object value, boolean hadProperty, boolean coerce, boolean changing) {
		try {
			if (name instanceof String && ((String) name).startsWith(":"))
				return value;
			if(schema == null)
				return value;
			Object superType = getSuperType(schema);
			if (superType instanceof Persistable){
				// first check to see if we are valid by the super type
				enforceSchemaForProperty((Persistable) superType, object, name, value, hadProperty, coerce, changing);
			}
	    	Object typeDefObject = schema.get(name instanceof Number ? "items" : "properties");
	    	Scriptable typeDef = null;
	    	if (typeDefObject instanceof Scriptable) {
	    		typeDef = (Scriptable) typeDefObject;
				Object structFieldObj;
				if (name instanceof Number) // a name indicates that it is an array item
					structFieldObj = typeDef;
				else {
					structFieldObj = typeDef.get((String) name, typeDef);
					if (!(structFieldObj instanceof Scriptable) && schema.get("additionalProperties") instanceof Persistable){
						// use additionalProperties if we don't find the property in the super types
						while(superType instanceof Persistable && !(structFieldObj instanceof Scriptable) && name instanceof String){
							typeDefObject = ((Persistable)superType).get("properties");
							if (typeDefObject instanceof Scriptable) {
								structFieldObj = ((Scriptable)typeDefObject).get((String) name, ((Scriptable)typeDefObject));
							}
							superType = getSuperType(((Scriptable)superType));
						}
						if(structFieldObj instanceof Scriptable)
							structFieldObj = null; // the superclass can do the validation, no sense in doing it twice
						else // the property was not found, revert to additionalProperties
							structFieldObj = schema.get("additionalProperties");
					}
					if(changing){
						if (structFieldObj instanceof Scriptable && Boolean.TRUE.equals(((Scriptable)structFieldObj).get("readonly", (Scriptable)structFieldObj)))
							validationError("property is a readonly property");
					}
					if(structFieldObj instanceof Scriptable && Boolean.TRUE.equals(ScriptableObject.getProperty((Scriptable)structFieldObj,"coerce")))
						coerce = true;
					if (Boolean.FALSE.equals(structFieldObj)){
						if(coerce) {
							object.delete((String) name);
							value = ScriptableObject.NOT_FOUND;
						}
						else
							validationError("Additional properties not allowed according to this schema");
					}
				}
				if (structFieldObj instanceof Scriptable) {
					Scriptable structField = (Scriptable) structFieldObj;
					if(Boolean.TRUE.equals(ScriptableObject.getProperty(structField,"coerce")))
						coerce = true;
					Object onSet;
					if (changing && (onSet = structField.get("onSet", structField)) instanceof Callable){
						if(value == Scriptable.NOT_FOUND)
							value = Undefined.instance;
						Object originalValue = value;
						value = ((Callable)onSet).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), object, new Object[]{value,name,structField});
						if(value == Undefined.instance)
							value = originalValue;
					}
					if(coerce)
						value = coerceValueForSchema(structField, object, name, value);
					else {
						enforceSchemaForValue(structField, value);
					}
					return value;
				}
	    	}
			return value;
		}
		catch (EcmaError e) {
			throw addPropertyToValidationError(e,"property " + name);
		}
	}
	/**
	 * Checks to ensure that the internals of the class instance is valid by the schema
	 * @param schema
	 * @param instance
	 */
	static void enforceObjectIsValidBySchema(Persistable schema, Persistable instance){
		Object superType = getSuperType(schema);
		if (superType instanceof Persistable){
			// first check to see if we are valid by the super type
			enforceObjectIsValidBySchema((Persistable) superType, instance);
		}
		Object propertiesDefinitions = schema.get("properties");
		if (propertiesDefinitions instanceof Persistable) {
				Object[] propertyIds = ((Persistable)propertiesDefinitions).getIds();
				for (Object property : propertyIds){
					if (property instanceof String) {
						Object value = instance.get((String)property);
						Object newValue = enforceSchemaForProperty(schema, instance, (String)property, value, true, false, false);
						if(newValue != value) {
							instance.put((String) property, instance, newValue); 
						}
					}
				}
		}
		Object additionalPropertiesDefinitions = schema.get("additionalProperties");
		if (additionalPropertiesDefinitions instanceof Scriptable || additionalPropertiesDefinitions instanceof Boolean) {
			Object[] propertyIds = instance.getIds();
			for (Object property : propertyIds){
				if (property instanceof String){
					boolean found = false;
					superType = schema;
					while (superType instanceof Persistable&& !found){
						propertiesDefinitions = ((Persistable)superType).get("properties", (Persistable)superType);
						if(propertiesDefinitions instanceof Persistable){
							if(((Scriptable)propertiesDefinitions).get((String) property,(Scriptable)propertiesDefinitions) instanceof Scriptable){
								found = true;
							}
						}
						superType = getSuperType((Scriptable)superType);
					}
					if(!found){
						if (Boolean.FALSE.equals(additionalPropertiesDefinitions))
							validationError("Additional properties not allowed, and " + property + " is not defined in properties");
						else if (additionalPropertiesDefinitions instanceof Scriptable)
							enforceSchemaForProperty(schema, instance, (String)property, instance.get((String)property), true, false, false);
					}
				}
				
						
					
			}
			
		}
	}
	/**
	 * Ensures that the value is valid by the schema (for class 
	 * instances does not test the internals of an object, verifies 
	 * that the object is an instanceof the schema)
	 * @param schema
	 * @param obj
	 */
	static void enforceSchemaForValue(Scriptable schema, Object obj) {

		if (obj == Undefined.instance || obj == Scriptable.NOT_FOUND) {
			if (!Boolean.TRUE.equals(schema.get("optional", schema)))
				validationError("A value is required");
		} else if (schema instanceof PersistableClass) {
			if (obj instanceof Persistable) {
				Scriptable classProto = ((PersistableClass) schema).getPrototypeProperty();
				Scriptable proto = ((Persistable)obj).getPrototype();
				do {
					if (proto == classProto)
						return;
					proto = proto.getPrototype();
				} while (proto != null);
			}
			if(obj == null)
				return;
			validationError("value is not an instance of " + ((PersistableClass)schema).id.source.getId());
		} else {
			Object typeObj = schema.get("type", schema);
			enforcePrimitive(typeObj,obj);
			if (obj instanceof String && 
					(typeObj = schema.get("pattern", schema)) instanceof String)
				if (!((String)obj).matches((String) typeObj))
					validationError("does not match the regex pattern " + typeObj);
			if (obj instanceof Number && (typeObj = schema.get("minimum", schema)) instanceof Number)
				if (((Number)obj).doubleValue() < ((Number)typeObj).doubleValue())
					validationError("must have a minimum value of " + typeObj);
			if (obj instanceof Number && (typeObj = schema.get("maximum", schema)) instanceof Number)
				if (((Number)obj).doubleValue() > ((Number)typeObj).doubleValue())
					validationError("must have a maximum value of " + typeObj);
			if (obj instanceof String && (typeObj = schema.get("maxLength", schema)) instanceof Number)
				if (((String)obj).length() > ((Number)typeObj).intValue())
					validationError("may only be " + typeObj + " characters long");
			if (obj instanceof String && (typeObj = schema.get("minLength", schema)) instanceof Number)
				if (((String)obj).length() < ((Number)typeObj).intValue())
					validationError("must be at least " + typeObj + " characters long");
			if (obj instanceof List && (typeObj = schema.get("maxItems", schema)) instanceof Number)
				if (((List)obj).size() > ((Number)typeObj).intValue())
					validationError("may only have " + typeObj + " items in the array");
			if (obj instanceof List && (typeObj = schema.get("minItems", schema)) instanceof Number)
				if (((List)obj).size() < ((Number)typeObj).intValue())
					validationError("must have at least " + typeObj + " items in the array");
			if (obj instanceof List && (typeObj = schema.get("items", schema)) instanceof Persistable)
				for(Object item : (List) obj){
					enforceSchemaForProperty((Persistable) schema, (Persistable) obj, 0, item, true, false, true);
				}
					
			if ("date-time".equals(schema.get("format", schema)) && 
					!(obj instanceof Date || ((obj instanceof IdScriptableObject) && ((Scriptable)obj).getClassName().equals("Date"))))
				validationError("must be a date in ISO 8601 format of YYYY-MM-DDThh:mm:ssZ in UTC time");
			if ((typeObj = schema.get("enum", schema)) instanceof List){
				boolean found = false;
				for (Object value : (List)typeObj){
					if (value.equals(obj)){
						found = true;
						break;
					}
				}
				if (!found)
					validationError("must be in the enum list of possible values");
			}
		}
		Object superType = getSuperType(schema);
		if (superType instanceof Persistable){
			// first check to see if we are valid by the super type
			enforceSchemaForValue((Persistable) superType, obj);
		}
		
	}

    public boolean hasInstance(Scriptable instance)
    {
        Object protoProp = getPrototypeProperty();
        if (protoProp instanceof Scriptable) {
            return ScriptRuntime.jsDelegatesTo(instance, (Scriptable)protoProp);
        }
        throw ScriptRuntime.typeError1("msg.instanceof.bad.prototype",
                                       getId().toString());
    }
	
	/**
	 * Delegation to the "real" persisted object (the config file object) 
	 */
	
	public boolean avoidObjectDetection() {
		return realObject.avoidObjectDetection();
	}
	public void defineConst(String name, Scriptable start) {
		realObject.defineConst(name, start);
	}
	public void defineFunctionProperties(String[] names, Class clazz, int attributes) {
		realObject.defineFunctionProperties(names, clazz, attributes);
	}
	public void defineProperty(String propertyName, Class clazz, int attributes) {
		realObject.defineProperty(propertyName, clazz, attributes);
	}
	public void defineProperty(String propertyName, Object value, int attributes) {
		realObject.defineProperty(propertyName, value, attributes);
	}
	public void defineProperty(String propertyName, Object delegateTo, java.lang.reflect.Method getter, java.lang.reflect.Method setter, int attributes) {
		realObject.defineProperty(propertyName, delegateTo, getter, setter, attributes);
	}
	public void delete(int index) {
		realObject.delete(index);
	}
	public void delete(String name) {
		if("extends".equals(name)){
			Object superType = get("extends");
			if(superType instanceof PersistableClass) 
				((PersistableClass)superType).subTypes.remove(this);
			setPrototype(ObjectId.idForString("Class/Object").getTarget());

		}

		realObject.delete(name);
	}
	public boolean equals(Object obj) {
		return realObject.equals(obj) || super.equals(obj);
	}
	public Object execIdCall(IdFunctionObject f, Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
		return realObject.execIdCall(f, cx, scope, thisObj, args);
	}
	public Object get(int index, Scriptable start) {
		return realObject.get(index, realObject);
	}
	public Object get(int index) {
		return realObject.get(index);
	}
	public Object get(String name){
		Object returnValue = get(name, this);
		if(returnValue == Scriptable.NOT_FOUND){
			returnValue = super.get(name);
			if(returnValue instanceof Function){
				return returnValue;
			}
			return Scriptable.NOT_FOUND;
		}
		return returnValue;
	}
	public Object get(String name, Scriptable start) {
		if(name.equals("prototype")){
			return getPrototypeProperty();
		}
    	if (id != null && id.source != null) {
    		if("id".equals(name)){
    			return id.toString();
    		}
    		if(securityEnabled.get() != null){
    			checkSecurity(this, PermissionLevel.READ_LEVEL.level);
    		}
    	}
		if(name.equals("instances")){
			return ObjectId.idForObject(DataSourceManager.getSource(id.subObjectId),"").getTarget();
		}
		return realObject.noCheckGet(name);
	}
	public Object getCoreValue(String name) {
		return get(name,this);
	}
	public int getAccessLevel() {
		return realObject.getAccessLevel();
	}
	public Object[] getAllIds() {
		return realObject.getAllIds();
	}
	public int getAttributes(int index) {
		return realObject.getAttributes(index);
	}
	public int getAttributes(String name) {
		return realObject.getAttributes(name);
	}
	public Object getGetterOrSetter(String name, int index, boolean isSetter) {
		return realObject.getGetterOrSetter(name, index, isSetter);
	}
	public Object[] getIds() {
		return realObject.getIds();
	}
	public Date getLastModified() {
		return realObject.getLastModified();
	}
	public boolean has(int index, Scriptable start) {
		return realObject.has(index, start);
	}
	public boolean has(String name, Scriptable start) {
		return realObject.has(name, start);
	}
	public int hashCode() {
		return realObject.hashCode();
	}
	public boolean isConst(String name) {
		return realObject.isConst(name);
	}
	public Set<String> keySet(boolean includeDontEnum) {
		return realObject.keySet(false);
	}
	public Object noCheckGet(String key) {
		return realObject.noCheckGet(key);
	}
	public void onCreation() {
		realObject.onCreation();
	}
	public void put(int index, Scriptable start, Object obj) {
		realObject.put(index, realObject, obj);
	}
	public void put(String name, Scriptable start, Object obj) {
		if("prototype".equals(name)){
			Scriptable prototype = getPrototypeProperty();
			if(prototype == null)
				setPrototypeProperty((Scriptable) obj);
			else{
				for(Map.Entry<String, Object> entry : PersistableObject.entrySet((ScriptableObject) obj, 2)){
					prototype.delete(entry.getKey());
				}
				for(Map.Entry<String, Object> entry : PersistableObject.entrySet((ScriptableObject) obj, 2)){
					prototype.put(entry.getKey(), prototype, entry.getValue());
				}
				obj = prototype;
				addAbstractMethods();
			}
		}
		if("methods".equals(name)){
			realObject.put(name, realObject, obj);
			addAbstractMethods();
			return;
		}
		if("extends".equals(name)){
			Object superType = get("extends");
			if(superType instanceof PersistableClass) 
				((PersistableClass)superType).subTypes.remove(this);
			if(obj != null){
				if(obj instanceof ObjectId){
					obj = ((ObjectId)obj).getTarget();
				}
				if(obj instanceof Scriptable && !id.subObjectId.equals("Class"))
					setPrototype((Scriptable) obj);
				if(obj instanceof PersistableClass)
					((PersistableClass)obj).subTypes.add(this);
			}
			
		}
		else{
			if("id".equals(name)){
				if(getId().isPersisted() && !getId().subObjectId.equals(ScriptRuntime.toString(obj))){
					throw ScriptRuntime.constructError("TypeError", "Can not change the id of a persisted object");					
				}
				getId().subObjectId = ScriptRuntime.toString(obj);
				return;
			}
		}

		realObject.put(name, realObject, obj);
	}
	public void putConst(String name, Scriptable start, Object value) {
		realObject.putConst(name, start, value);
	}

	public void sealObject() {
		realObject.sealObject();
	}
	public void setAttributes(int index, int attributes) {
		realObject.setAttributes(index, attributes);
	}
	public void setAttributes(int index, Scriptable start, int attributes) {
		realObject.setAttributes(index, start, attributes);
	}
	public void setAttributes(String name, int attributes) {
		realObject.setAttributes(name, attributes);
	}
	public void setGetterOrSetter(String name, int index, Callable getterOrSeter, boolean isSetter) {
		realObject.setGetterOrSetter(name, index, getterOrSeter, isSetter);
	}
	void noCheckSet(String key,Object value) {
//		Object sourceValue = asTransactionValue(key,super.get(key,this),value);
		realObject.noCheckSet(key,value);
	}
	public void setRealObject(PersistableObject realObject) {
		if (!permanentRealObject){ // we are now in post init mode
			for(Map.Entry<String, Object> entry : PersistableObject.entrySet(this.realObject, 2)){
				realObject.noCheckSet(entry.getKey(),entry.getValue());
			}

			for (Object key : this.realObject.getIds()){ // transfer all the properties
			}
/*			Scriptable collectionObject = new PersistableObject();
			realObject.noCheckSet("collection",collectionObject);
			collectionObject.put("items", collectionObject, this);*/
			this.realObject = realObject;
			this.realObject.parent = this;
			((SchemaObject)realObject).setSchemaPart(SchemaObject.SchemaPart.Schema);
		}
	}

	@Override
	public void delete() {
		// we do this because the objects can reappear later when new classes are created
		deleteProperties(this, new HashSet());
		super.delete();
	}
	private static void deleteProperties(Persistable target, Set<Persistable> deleted){
		deleted.add(target);
		for(Object key : target.getIds()){ // recursively delete everything
			Object value = target.get(key.toString());
			if(value instanceof SchemaObject){
				if(!deleted.contains(value)){
					deleteProperties((Persistable) value, deleted);
				}
			}
			target.delete(key.toString());
		}
	}
	
}
