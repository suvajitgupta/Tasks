package org.persvr.datasource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.AbstractCollection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.persvr.data.DataSourceHelper;
import org.persvr.data.DataSourceManager;
import org.persvr.data.FunctionUtils;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableObject;
import org.persvr.remote.DataSerializer;
import org.persvr.remote.JSONFunction;
import org.persvr.remote.JavaScriptSerializer;
import org.persvr.remote.JsonReceiver;
import org.persvr.util.JSONParser.JSONException;

/**
 * A base class for JSON-based data sources (files and HTTP sources)
 * @author Kris
 *
 */
public abstract class AbstractJsonSource extends JsonReceiver implements DataSource, ListDataSource {
	Object SOURCE_URL_KEY = new Object();
	Object ACCESS_LEVEL_MAP_KEY = new Object();
	//TODO: Create a job to clear these out
	Map<String,Object> cachedJson = new HashMap<String,Object>();
	Map<String,Long> cacheExpiration = new HashMap<String,Long>();
	public abstract boolean isTrusted();
	boolean trustJavaScript = false;
	/**
	 * Gets the JSON string for a particular object id. This is called when an object needs to be initialized, 
	 * and this AbstractJsonSource/JsonReceiver will handle the conversion of the JSON
	 * string to an object 
	 * @param objectId
	 * @return the JSON string
	 * @throws Exception
	 */
	protected abstract Object getJson(String resourceName) throws Exception;

	String id;
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
		
	}
	public void mapSchema(PersistableInitializer initializer) throws Exception {
		initializer.finished();
	}
	protected class RootAndResolved {
		Object root;
		Object resolved;
	}
	protected String getPathSeparator(){
		return "\udeaf";
	}
	public long defaultCacheLength = 10000;
	public void clearCache(){
		cachedJson.clear();
	}
	/**
	 * gets the parsed JSON for a given object id 
	 * @param objectId
	 * @return
	 * @throws Exception
	 */
	protected RootAndResolved getMap(String objectId) throws Exception {
		//TODO: in LocalJsonFileSource, we should check the file modification time
		String[] paths = objectId.split(getPathSeparator());
		String resourceName = paths[0];
		Object object = cachedJson.get(resourceName);
		if (object == null || cacheExpiration.get(resourceName) < new Date().getTime()){
			object = getJson(resourceName);
			cachedJson.put(resourceName, object);
			cacheExpiration.put(resourceName, new Date().getTime() + defaultCacheLength);
		}
		RootAndResolved rar = new RootAndResolved();
		rar.root = object;
		Object last = null;
		for (int i = 1; i < paths.length; i++){
			String pathPart = paths[i];
			if (object instanceof Map)
				object = ((Map) object).get(pathPart);
			else if (object instanceof List)
				try{
					object = ((List) object).get(Integer.parseInt(pathPart));
				}catch(IndexOutOfBoundsException e){
					throw new ObjectNotFoundException(this, objectId);
				}
			if (object == null) {
				if ("schema".equals(pathPart))// a little exception so we can bootstrap
					((Map)last).put("schema",object = new HashMap());
				else
					throw new ObjectNotFoundException(this,objectId);
			}
			last = object;
		}
		rar.resolved = object;
		return rar;
	}
	DataSerializer serializer = new JavaScriptSerializer(){
		public void serialize(Object value,Request request, Writer writer) {
			Serialization serialization = new ConfigSerialization();
			serialization.request = request;
			try {
				serialization.writeValue(writer, value, false);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		class ConfigSerialization extends JavaScriptSerialization {
			protected boolean canReference(Persistable obj, Persistable referrer) {
				return obj.getId().source != AbstractJsonSource.this && obj.getId().source != null; 
			}
		}

	};
	boolean useIds(){
		return true;
	}
	protected Object convertJsonToJavaScript(Object value, String id) {
		String fullId = (id.startsWith("http://") || id.startsWith("https://")) ? id : (getId() + '/' + id); 
		if (value instanceof Map || value instanceof List){
			if (value instanceof Map && ((Map)value).containsKey("$ref")){
	    		Identification refId = Identification.idForRelativeString(fullId, (String) ((Map)value).get("$ref"));
	    		if(refId instanceof ObjectId && ((ObjectId)refId).subObjectId == null){
	    			refId = ObjectId.idForObject(DataSourceManager.getMetaClassSource(), ((ObjectId)refId).source.getId());
	    		}
	    		return refId;
			}
			Identification objId;
			if (value instanceof Map && ((Map)value).containsKey("id") && useIds())
	    		objId= Identification.idForRelativeString(fullId, (String) ((Map)value).get("id"));
			else
				objId = ObjectId.idForObject(this, id, true);
			if(!(objId instanceof ObjectId))
				throw new RuntimeException("An canonical id must be used for object identification");
			synchronized(objId){
				PersistableInitializer initializer = DataSourceHelper.initializeObject((ObjectId) objId);
				if(!PersistableObject.checkForExistingDirty(initializer)){
					Object result = mapJson(initializer,value, objId.subObjectId);
					if(result != null)
					return result;
				}
				
			}
			return objId;
		}
		else if (value instanceof JSONFunction){
			if(isTrusted()){
				value = FunctionUtils.createFunction(((JSONFunction) value).toString(), "function");
			}else{
				value = FunctionUtils.createFunction("function(){throw new AccessError(\"Server code not trusted from " + getId() + "\");}", "function");
			}
		}
		return value;
	}
	//TODO: mapArray
	public void mapObject(PersistableInitializer initializer, final String objectId) throws Exception {
		ObjectId objId = ObjectId.idForObject(this, objectId);

		final Object object = getMap(objectId).resolved;
		mapJson(initializer,object,objectId);
	}
	protected Object mapJson(PersistableInitializer initializer, final Object object, final String objectId) {
		if (object instanceof Map){ 
			for (Map.Entry<String,Object> entry : ((Map<String,Object>)object).entrySet()){
				String key = entry.getKey();
				if (!"id".equals(key))
					initializer.setProperty(key, convertJsonToJavaScript(entry.getValue(),objectId + getPathSeparator() + key));
			}
		}
		else if (object instanceof List){
			initializer.initializeList(new AbstractCollection<Object>(){
			    public Iterator<Object> iterator(){
			    	return new Iterator(){
						int i = 0;
						public boolean hasNext() {
							return i < ((List)object).size();
						}

						public Object next() {
							try {
								return convertJsonToJavaScript(((List)object).get(i),objectId + getPathSeparator() + i++);
								
								
							} catch (JSONException e) {
								throw new RuntimeException(e);
							}
						}

						public void remove() {
							throw new UnsupportedOperationException("Not  implemented yet");
						}
					};	    	
			    }

			    public int size(){
					return ((List)object).size();	
			    }

			});
		}
		if(objectId.indexOf(getPathSeparator()) != -1) {
			int lastPathStart = objectId.lastIndexOf(getPathSeparator());
			initializer.setParent(ObjectId.idForObject(this, objectId.substring(0,lastPathStart), true));
		}
		return null;
	}
	protected static String getResourceAsString(InputStream is) throws IOException {
		BufferedReader in = new BufferedReader(new InputStreamReader(is));
		StringBuffer buffer = new StringBuffer();
		String line;
		while ((line = in.readLine()) != null) {
			buffer.append(line);
			buffer.append("\n");
		}
		return buffer.toString();
	}
	InheritableThreadLocal<Set<String>> dirty = new InheritableThreadLocal<Set<String>>();
	InheritableThreadLocal<Set<Persistable>> newObjects = new InheritableThreadLocal<Set<Persistable>>();
	public void abortTransaction() throws Exception {
	}
	protected abstract void setJson(String resourceName, String json) throws Exception;
	// TODO: May need to include the target table when doing path based guesses for POSTs
	protected abstract void newJson(String json) throws Exception;
	/**
	 * suppress writes during startup
	 */
	public static boolean suppressWrites = true ;
	/**
	 * serializes all the dirty objects
	 * @throws Exception
	 */
	public void commitTransaction() throws Exception {
		if(suppressWrites)
			return;
		for (String resourceName : dirty.get()){
			setJson(resourceName,serialize(ObjectId.idForObject(this, resourceName, true).getTarget()));
		}
		for (Persistable newObject : newObjects.get()){
			newJson(serialize(newObject));
		}
	}
	public NewObjectPersister recordNewObject(Persistable object) throws Exception {
		newObjects.get().add(object);
		return new StartAsEmptyPersister(){
			String id = (Math.random() +"").substring(2);
			public String getObjectId() {
				return id;
			}
			public boolean isHiddenId() {
				return true;
			}

			public DataSource getSource() {
				return AbstractJsonSource.this;
			}

			@Override
			public void recordProperty(String name, Object value) throws Exception {
			}
			
		};
	}

	protected String serialize(Persistable target){
		StringWriter writer = new StringWriter();
		serializer.serialize(target, new DataSerializer.Request(){

			public int[] getIndexRange(List obj) {
				return new int[]{0,obj.size()};
			}

			public String idString(Identification id) {
				return id.toString(AbstractJsonSource.this, "");
			}
			

			public boolean shouldSerialize(Persistable obj) {
				return obj.getId().source == AbstractJsonSource.this || obj.getId().source == null;
			}

			public boolean getFeature(SerializerFeature feature) {
				return feature == SerializerFeature.IncludeServerMethods;
			}
			
		}, writer);
		return writer.toString();
	}
	public void makeDirty(String objectId){
		dirty.get().add(objectId.split(getPathSeparator())[0]);
	}
	public void startTransaction() throws Exception {
		dirty.set(new HashSet<String>());
		newObjects.set(new HashSet<Persistable>());
	}
	public boolean hiddenId(String id) {
		return id == null || id.indexOf(getPathSeparator()) > -1;
	}
	public void recordList(String objectId, List<? extends Object> values)throws Exception {
		int i = 0;
		for(Object value : values)
			handleNewObject(value, "" + (i++), objectId);
		makeDirty(objectId);
	}
	public void recordPropertyAddition(String objectId, String name, Object value, int attributes) throws Exception {
		handleNewObject(value,name,objectId);
		makeDirty(objectId);
		//recordPropertyChange(objectId, name, value);
	}
	/*Object getDirtyObject(String objectId)throws Exception{
		RootAndResolved rar = getMap(objectId);
		dirtyJson.put(objectId.split(pathSeparator)[0], rar.root);
		return rar.resolved;
	}*/
	public void recordPropertyChange(String objectId, String name, Object value, int attributes) throws Exception {
		//((Map)getDirtyObject(objectId)).put(name, convertJavaScriptToJson(value,objectId + pathSeparator + name));
		//saveChange(objectId);
		handleNewObject(value,name,objectId);
		makeDirty(objectId);
	}
	public void recordPropertyRemoval(String objectId, String name) throws Exception {
		makeDirty(objectId);
	}

	protected void handleNewObject(Object value, final String key, final String parentId){
		if (value instanceof ObjectId) {
			ObjectId id = (ObjectId) value;
				id.persistIfNeeded(new StartAsEmptyPersister(){

					@Override
					public void initializeAsList(List<? extends Object> values) throws Exception {
						int i = 0;
						for(Object value : values){
							handleNewObject(value instanceof Persistable ? ((Persistable) value).getId() : value, "" + (i++), getObjectId());
						}
					}

					public boolean isHiddenId() {
						return true;
					}

					@Override
					public void recordProperty(String name, Object value) throws Exception {
						handleNewObject(value instanceof Persistable ? ((Persistable) value).getId() : value, name, getObjectId());
					}

					public String getObjectId() {
						return parentId + getPathSeparator() + key;
					}

					public ObjectId getParent() {
						return ObjectId.idForObject(AbstractJsonSource.this, parentId, true);
					}

					public DataSource getSource() {
						return AbstractJsonSource.this;
					}


				});
		}
	}
}
