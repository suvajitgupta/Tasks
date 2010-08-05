package org.persvr.datasource;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.persvr.data.DataSourceManager;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableClass;
import org.persvr.data.Query;
import org.persvr.data.QueryCantBeHandled;
import org.persvr.data.SchemaObject;
import org.persvr.data.Transaction;
import org.persvr.security.SystemAcls;

public class ClassDataSource implements WritableDataSource, UserAssignableIdSource {

	public void abortTransaction() throws Exception {
	}

	public void commitTransaction() throws Exception {
	}

	public void startTransaction() throws Exception {
	}

	public boolean hiddenId(String id) {
		return false;
	}

	public boolean isIdAssignable(String objectId) {
		return true;
	}

	public void setIdSequence(long nextId) {
		throw new UnsupportedOperationException("Not implemented");
	}
	private void setParents(Persistable object){
		for(Map.Entry<String, Object> entry : object.entrySet(0)){
			Object value = entry.getValue();
			if(value instanceof SchemaObject){
				if (((SchemaObject)value).setParentIfNeeded(object)){
					setParents((Persistable)value);
				}
			}
		}
	}
	public NewObjectPersister recordNewObject(Persistable object) throws Exception {
		ObjectId existingId = object.getId();
		Object className = existingId.source instanceof ClassDataSource ? 
				object.getId().subObjectId : object.get("id");
		if(!(className instanceof String) || ((String)className).startsWith("s$")){
			className = (Math.random() + "").substring(2);
		}
		
		object.delete("id");
		existingId.assignId(this, (String) className);
		Object superType = object.get("extends");
		final DataSource newSource;
		if(((PersistableClass) object).persist){
			newSource = DataSourceManager.createNewSource((String) className,superType instanceof Persistable ? ((Persistable) superType).getId().subObjectId : "Object",(PersistableClass) object);
		}else{
			Map config = new HashMap();
			config.put("name", className);
			newSource = DataSourceManager.initSource(config,null, (PersistableClass)object, "");
			setParents(object);
		}
		return new StartAsEmptyPersister() {

			public Object getAcl() {
				return SystemAcls.DEFAULT_ACL;
			}

			public String getObjectId() {
				return newSource.getId();
			}
			public boolean isHiddenId() {
				return false;
			}

			public ObjectId getParent() {
				return DataSourceManager.getRootObject().getId();
			}

			public DataSource getSource() {
				return ClassDataSource.this;
			}

			@Override
			public boolean reloadFromSource() {
				return false;
			}

			public void initializeAsList(List<? extends Object> values) throws Exception {
				throw new RuntimeException("The root of data source can not be a list, it must be a schema");
			}

			public void start() throws Exception {
			}
			
		};
	}

	public void recordDelete(String objectId) throws Exception {
		if (objectId == null)
			throw new RuntimeException("You can't delete the root"); // kind of like asking for fdisk
		sourceToConfigObject.remove(objectId);
		DataSourceManager.deleteSource(objectId); 
	}

	public void recordListAdd(String objectId, Object value) throws Exception {
		throw new RuntimeException("You can add to the root, you can only PUT new sources on it");
	}

	public void recordListRemoval(String objectId, Object value) throws Exception {
		throw new RuntimeException("You can remove from the root, you can only DELETE sources on it");
	}

	public void recordPropertyAddition(final String objectId, String name, final Object value, int attributes) throws Exception {
		if (objectId != null) {
			if ("instances".equals(name)) {
				throw new RuntimeException("can not change data");
			}
			ObjectId configId = sourceToConfigObject.get(objectId);
			if(configId != null){
				Transaction.addAffectedSource((WritableDataSource) configId.source);
				((WritableDataSource) configId.source).recordPropertyAddition(configId.subObjectId, name, value, 0);
			}
		}
	}

	public void recordPropertyChange(String objectId, String name, Object value, int attributes) throws Exception {
		ObjectId configId = sourceToConfigObject.get(objectId);
		if(configId != null){
			Transaction.addAffectedSource((WritableDataSource) configId.source);
	
			((WritableDataSource) configId.source).recordPropertyChange(configId.subObjectId, name, value, 0);
		}
	}

	public void recordPropertyRemoval(String objectId, String name) throws Exception {
		if (objectId == null)
			DataSourceManager.deleteSource(name);
		else {
			ObjectId configId = sourceToConfigObject.get(objectId);
			if(configId != null){
				Transaction.addAffectedSource((WritableDataSource) configId.source);
	
				((WritableDataSource) configId.source).recordPropertyRemoval(configId.subObjectId, name);
			}
		}
	}

	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		return null;
	}
	String id;
	public String getId() {
		return id;
	}
	Map<String,ObjectId> sourceToConfigObject = new HashMap<String,ObjectId>();
	public void addSourceConfigObject(String sourceName,ObjectId configObject){
		sourceToConfigObject.put(sourceName, configObject);
	}
	public void initParameters(Map parameters) throws Exception {
	}
	/*
	 * This stores properties for us
	 */
	private ObjectId getPersistableBackerId(String objectId) throws Exception {
		return sourceToConfigObject.get(objectId);
	}
	private Map<String,Object> getPersistableBacker(String objectId) throws Exception {
		MapInitializer initializer = new MapInitializer();
		ObjectId configId = sourceToConfigObject.get(objectId);
		configId.source.mapObject(initializer, configId.subObjectId);
		//DataSourceManager.baseObjectSource.mapObject(initializer,getPersistableBackerId(objectId));
		return initializer.getMap();
	}
	public void mapObject(PersistableInitializer initializer, String objectId) throws Exception {
		if (!("".equals(objectId) || "schemaProperties".equals(objectId) || "root".equals(objectId))) {
			ObjectId configId = sourceToConfigObject.get(objectId);
			if(configId == null)
				throw new ObjectNotFoundException(this,objectId);
			configId.source.mapObject(initializer,configId.subObjectId);
			DataSource source = DataSourceManager.getSource(objectId);
			initializer.setProperty("instances", ObjectId.idForObject(source, ""));
			if (source instanceof DynaObjectDBSource) {
				DataSource superSource = ((DynaObjectDBSource)source).getSuperSource();
				if (superSource != null) {
					initializer.setProperty("extends", ObjectId.idForObject(this, superSource.getId()));
				}
			}
		}
		initializer.finished();
	}

	public void setId(String id) {
		this.id = id;
	}

	public Collection<Object> query(Query query) throws Exception {
		if (query.getCondition() != null || query.getSort() != null)
			throw new QueryCantBeHandled();
		List tables = new ArrayList();
		for (String sourceName : DataSourceManager.getDataSourceNames()) {
			tables.add(ObjectId.idForObject(this, sourceName));
		}
		
		return tables;
	}

	public String newId() {
		return (Math.random() + "").substring(2);
	}

}
