package org.persvr.datasource;

import java.util.List;

import org.persvr.data.ObjectId;
/**
 * This provides the interface for a new object to persist its data to a data source
 * @author Kris Zyp
 *
 */
public interface NewObjectPersister {
	/**
	 * This is called at the beginning of the persisting process
	 * @throws Exception
	 */
	public void start() throws Exception;
	
	/**
	 * If this is called it indicates that the object is an array/list.
	 * @param The values of the list
	 * @throws Exception
	 */
	public void initializeAsList(List<? extends Object> values) throws Exception;
	/**
	 * This is called for each of the properties of the new object that need to be persisted.
	 * @param name
	 * @param value - This value can be 
	 * @throws Exception
	 */
	public void recordProperty(String name, Object value) throws Exception;
	/**
	 * This is called to find out from the data source what parent should be used for this object
	 * now that it is persisted
	 * @return a java.security.Acl object directly or a org.persvr.data.ObjectId to indicate which object security should be inherited from
	 */
	public ObjectId getParent();
	/**
	 * Returns whether this object has a real, visible, referenceable id.
	 * @return
	 */
	public boolean isHiddenId();
	/**
	 * This is called after all the initialization and recordProperty calls are finished 
	 * @throws Exception
	 */
	public void finished() throws Exception;
	/**
	 * Indicates whether the object should be reloaded from the source after being persisted
	 * @return
	 */
	public boolean reloadFromSource();
	/**
	 * This is called to determine the data source of the new object. By default this is called at the end of the persistence (after the initialize and record methods are called)
	 * @return
	 */
	public DataSource getSource();
	/**
	 * This is called to determine the object id of the new object. By default this is called at the end of the persistence (after the initialize and record methods are called)
	 * @return
	 */
	public String getObjectId();
}