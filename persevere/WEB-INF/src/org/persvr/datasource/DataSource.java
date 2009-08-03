/*
 * DataSource.java
 *
 * Created on July 4, 2005, 10:48 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.datasource;

import java.util.Collection;
import java.util.Map;

import org.persvr.data.LazyPropertyId;
import org.persvr.data.Query;

/**
 *This is an interface to map persistent data sources to objects
 * @author Kris Zyp
 */
public interface DataSource {
	/**
	 * Gets a string identification of the data source
	 * @return
	 */
    String getId();
	/**
	 * Sets a string identification of the data source
	 * @param id
	 */
    void setId(String id);
    /**
     * This is called on initialization and provides access to the data source configuration parameters
     * @param parameters
     * @throws Exception
     */
    void initParameters(Map<String,Object> parameters) throws Exception;
    /**
     * This is called when an object is being activated to retrieve the persisted data for a given object 
     * @param initializer
     * @param objectId
     * @throws Exception
     */
    void mapObject(PersistableInitializer initializer, String objectId) throws Exception;
    /**
     * This is called when a field value contains an unfulfilled value (ValueId)
     * @param valueId
     * @return the real value referred to by valueId
     * @throws Exception
     */
    Object getFieldValue(LazyPropertyId valueId) throws Exception;

    /**
     * This is called when an object is being activated to retrieve the persisted data for a given object with a filter
     * @return
     * @throws Exception
     */
    Collection<Object> query(Query query) throws Exception;
}
