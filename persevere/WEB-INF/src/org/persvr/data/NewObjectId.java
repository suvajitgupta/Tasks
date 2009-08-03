package org.persvr.data;

import java.lang.ref.SoftReference;

import org.persvr.datasource.DataSource;
import org.persvr.datasource.NewObjectPersister;
/**
 * NewObjectId should be the id object assigned to newly created objects (ones that have not been restored from
 * persistent storage)
 * @author Kris Zyp
 *
 */
public class NewObjectId extends ObjectId {
	static int nextTempId = 0;
	public NewObjectId(Persistable target) { 
		targetRef = new SoftReference(target);
		subObjectId = "s$" + nextTempId++;
		addObjectId(subObjectId, this);
		// Do we want to record this in the idMap?
	}
	private boolean hidden = true;
	public boolean hidden(){
		return hidden;
	}
	boolean assignedId = false;
	public boolean isAssignedId(){
		return assignedId;
	}
	public void assignId(DataSource source, String objectId, boolean hidden) {
		super.assignId(source, objectId);
		assignedId = true;
		this.hidden = hidden;
	}

	boolean persisted = false; 
	@Override
	public synchronized void persistIfNeeded(NewObjectPersister newObjectPersister) {
		if (!persisted & targetRef.get() != null) {
			persisted = true;
			assignedId = true;
			try {
				newObjectPersister.start();
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
			source = newObjectPersister.getSource();
			String newId = newObjectPersister.getObjectId();
			if (newId != null) {// if the new id is available we will set it right now, this is needed for circular referencing 
				subObjectId = newId;
				addObjectId(toString(), this);
			}
			
			hidden = newObjectPersister.isHiddenId();
			PersistableObject.persistNewObject((Persistable) targetRef.get(),newObjectPersister);
			if (newId == null) {// sometimes the newId wasn't available before persistence (like in the case of database inserts that return a new sequence id), so we need to get it now
				subObjectId = newObjectPersister.getObjectId();
				addObjectId(toString(), this);
			}
			if (newObjectPersister.reloadFromSource())
				PersistableObject.mapPersistent(this); // we want to retrieve from the data source to make sure we got it right
//			targetRef = new SoftReference(targetRef); // now that it is persisted, we can make a soft reference			
		}
	}
	
	@Override
	public boolean isPersisted() {
		return persisted;
	}

}
