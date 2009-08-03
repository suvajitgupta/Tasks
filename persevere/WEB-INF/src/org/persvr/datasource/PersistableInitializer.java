package org.persvr.datasource;

import java.util.Collection;
import java.util.Date;

import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.Version;

/**
 * This provides an interface for a persisted object to be initialized from a data source 
 * @author Kris Zyp
 *
 */
public interface PersistableInitializer {
	/**
	 * This should be called to indicate that the new data object should be a list and provides an iterator to populate the list
	 * The iterator may not go through all the values in the list at the initial load, but may wait until they are needed (which may be much later)
	 * @param sourceCollection
	 */
	void initializeList(Collection sourceCollection);
	/**
	 * This should be called to initialize an object to inherit it's acl and schema from another object. 
	 * @param source
	 * @param parentScope
	 */
	void setParent(ObjectId objectToInheritFrom);
	/**
	 * This should be called to set the version information for the object 
	 * @param source
	 * @param parentScope
	 */
	void setVersion(Version version);
	/**
	 * This should be called to set the last modified date for the object 
	 * @param source
	 * @param parentScope
	 */
	void setLastModified(Date lastModified);
	/**
	 * This should be called to initialize a property value
	 * @param source
	 * @param parentScope
	 */
	void setProperty(String name, Object value);
	/**
	 * This can be called to initialize a property value with attributes (like DontEnum, and ReadOnly)
	 * @param source
	 * @param parentScope
	 */
	void setProperty(String name, Object value, int attributes);
	/**
	 * This should be called to indicate that the initialization is complete
	 * @param source
	 * @param parentScope
	 */
	void finished();
	/**
	 * This can be called to return the newly initialized object
	 * @return the new data object
	 */
	Persistable getInitializingObject();
}
