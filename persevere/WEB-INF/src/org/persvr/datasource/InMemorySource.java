package org.persvr.datasource;

import java.io.IOException;
import java.sql.SQLException;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.Query;
import org.persvr.data.QueryCantBeHandled;

/**
 * This is a memory-only data source for Persevere.
 * 
 * @author Kris
 * 
 */
public class InMemorySource implements WritableDataSource, DataSource,ListDataSource, UserAssignableIdSource {
	public boolean isIdAssignable(String objectId) {
		try {
			// all the numbered ids are allocated for auto-assignment
			Long.parseLong(id);
			return false;
		} catch(NumberFormatException e){
			return true;
		}
	}
	public String newId() {
		currentId++;
		return (currentId) + "";
	}
	Set<Persistable> objects = new HashSet<Persistable>();
	long currentId = 0;
	public NewObjectPersister recordNewObject(final Persistable object) throws Exception {
		objects.add(object);
		return new StartAsEmptyPersister(){

			String id;
			public String getObjectId() {
				if(id == null) {
					if(object.getId().subObjectId.startsWith("s$")) {
						id = (currentId++) + "";
					}
					else{
						id = object.getId().subObjectId;
					}
				}
				return id;
			}

			public DataSource getSource() {
				return InMemorySource.this;
			}

			public boolean isHiddenId() {
				return false;
			}
			
		};
	}
	public void setIdSequence(long nextId) {
		currentId = nextId;
	}
	public Collection query(Query query) throws Exception {
		if ("".equals(query.subObjectId) && query.getCondition() == null && query.getSort() == null){
			return objects;
		}
		throw new QueryCantBeHandled("Can't handle any queries for InMemorySource");
	}
	public void initParameters(Map parameters) throws Exception {
	}

	public void recordPropertyAddition(String id, final String key, Object value, final int attributes) throws SQLException {
	}
	public void recordPropertyChange(String id, final String key, Object value, final int attributes) throws SQLException {
	}
	public void recordPropertyRemoval(String id, String name) throws SQLException {
	}

	public void recordList(String id, List<? extends Object> values) throws SQLException {
	}
	public void recordDelete(String objectId) throws Exception {
		objects.remove(ObjectId.idForObject(this, objectId).getTarget());
	}

	public void abortTransaction() throws Exception {
	}
	public void commitTransaction() throws Exception {
	}
	public void startTransaction() throws Exception {
	}
	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	String id;
	public String getId() {
		return id;
	}
	public void mapObject(PersistableInitializer initializer, String objectId) throws Exception {
		throw new ObjectNotFoundException(this,objectId);
	}
	public void setId(String id) {
		this.id = id;
	}

}
