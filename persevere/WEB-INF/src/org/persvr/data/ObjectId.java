package org.persvr.data;


import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.util.HashSet;
import java.util.Map;

import org.mozilla.javascript.ScriptRuntime;
import org.persvr.Persevere;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.NewObjectPersister;
import org.persvr.datasource.UserAssignableIdSource;
import org.persvr.remote.Client;
import org.persvr.remote.Client.IndividualRequest;
import org.persvr.remote.PersevereFilter.LocalDataSource;
import org.persvr.util.SoftValueHashMap;
import org.persvr.util.WeakValueHashMap;


/**
 * Represents a unique identifier of a persistable object
 * @author Kris Zyp
 */
public class ObjectId extends Identification<Persistable> {
	/**
	 * This is the id map and we synchronize all access to it
	 */
	private static Map<String,ObjectId> idMap = DataSourceManager.softReferences ? new SoftValueHashMap<String, ObjectId>(100) : new WeakValueHashMap<String, ObjectId>(100); 
	public boolean hidden(){
		return false;
	}
	/**
	 * Synchronized addition of an id
	 * @param key
	 * @param value
	 */
	protected static synchronized void addObjectId(String key, ObjectId value){
		idMap.put(key, value);
	}
	public static synchronized ObjectId idForString(String value) { 
		ObjectId objId = idMap.get(value);
		if (objId == null) {
			int lastSlash = value.lastIndexOf('/');
			DataSource source;
			if (lastSlash == -1){
				source = DataSourceManager.getSource(value);
				objId = new ObjectId();
				objId.source = source;
				objId.subObjectId = null;
			}
			else
			{
				String idPart = value.substring(lastSlash + 1);
				String sourcePart = value.substring(0, lastSlash);
				source = DataSourceManager.getSource(sourcePart);
				objId = new ObjectId();
				if ("".equals(idPart)) {
					objId = new Query();
				}
				objId.source = source;
				objId.subObjectId= idPart;
			}
			if (objId.source == null){
				if (value.matches("\\w+tps?:/.*")){
					int slashIndex = value.indexOf('/');
					objId.source = DataSourceManager.getSource(value.substring(0,slashIndex));
					objId.subObjectId = value.substring(slashIndex + 1);
					return objId;
				}
				return new ObjectNotFoundId(null,value);
			}
			idMap.put(value, objId);
		}
		return objId;
	}
	public Persistable getOrCreateTarget() {
		try {
			return getTarget();
		}
		catch (ObjectNotFoundException e) {
			Persistable object = Client.getCurrentObjectResponse().getConnection().getClientSideObject(toString());
			if (object != null){
				targetRef = new SoftReference<Persistable>(object);
				return object;
			}
			object = Persevere.newObject(e.getSource().getId());
			if(e.getSource() instanceof UserAssignableIdSource){
				if (!((UserAssignableIdSource)e.getSource()).isIdAssignable(subObjectId))
					throw ScriptRuntime.constructError("ReferenceError", "Can not assign the id " + this + ", id is reserved");
				((PersistableObject)object).id = this;		
			}
			targetRef = new SoftReference<Persistable>(object);
			Client.getCurrentObjectResponse().getConnection().clientSideObject(toString(),object);
			return object;
		}		
	}
	public static synchronized void onDeleteSource(DataSource source){
		for(Map.Entry<String,ObjectId> entry : new HashSet<Map.Entry<String,ObjectId>>(idMap.entrySet())){
			if (entry.getValue() != null && entry.getValue().source == source)
				idMap.remove(entry.getKey());
		}
	}
	@Deprecated
	public static void insertObjectForId(String id, Persistable obj) {
		idForString(id).targetRef = new WeakReference<Persistable>(obj);
	}
	@SuppressWarnings("unused")
	public void persistIfNeeded(NewObjectPersister newObjectPersister) {
	}
	public boolean isPersisted() {
		return true;
	}
	public boolean isAssignedId() {
		return true;
	}
	public boolean isLocal() {
		return source instanceof LocalDataSource;
	}
	public static ObjectId idForObject(DataSource source, String objectId) {
		return idForObject(source, objectId, false);
	}
	public static synchronized ObjectId idForObject(DataSource source, String objectId, boolean hidden) {
		if (objectId == null)
			throw new RuntimeException("objectId can not be null");
		String idAsString = source == null ? objectId : source.getId().length() == 0 ? objectId : source.getId() + '/' + objectId;
		ObjectId objId = idMap.get(idAsString);
		if (objId == null) {
			objId = "".equals(objectId) || (objectId != null && objectId.endsWith("/")) ? new Query() : hidden ? new HiddenObjectId() : new ObjectId();
			objId.source = source;
			objId.subObjectId = objectId;
			idMap.put(idAsString,objId);
		}else if (objId.source != source){
			// this is special case for changing ids when loading objects from HttpJsonSource
			objId = "".equals(objectId) || (objectId != null && objectId.endsWith("/")) ? new Query() : hidden ? new HiddenObjectId() : new ObjectId();
			objId.source = source;
			objId.subObjectId = objectId;
		}
		return objId;
	}
	public enum ObjectType {
		Object, Array, Function
	}
	protected ObjectId() {
	}
	public void assignId(DataSource source, String objectId) {
		this.source = source;
		this.subObjectId = objectId;
		addObjectId(toString(),this);
	}
	@Override
	protected Persistable resolveTarget() {
		if (source==null)
			return null;
		return PersistableObject.mapPersistent(this);
	}
	void removeFromCache(){
		idMap.remove(toString());
		IndividualRequest request = Client.getCurrentObjectResponse();
		if(request != null)
			request.getConnection().removeClientSideObject(toString());
	}

    @Override
	public boolean equals(Object obj) {
        if (obj == null)
            return false;
        return toString().equals(obj.toString());
    }

    @Override
	public int hashCode() {
    	if(source != null && subObjectId != null) // this is faster, if we can do it
    		return source.hashCode() + subObjectId.hashCode();
        return toString().hashCode();
    }
    public static class HiddenObjectId extends ObjectId {
    	public boolean hidden(){
    		return true;
    	}
    }
}
