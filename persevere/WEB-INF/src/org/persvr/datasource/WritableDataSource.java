package org.persvr.datasource;

import org.persvr.data.Persistable;

/**
 * This interface should be implemented by data sources that have modifiable data
 * @author Kris Zyp
 *
 */
public interface WritableDataSource extends DataSource {
    /**
     * This is called when a new property is added to an object
     * @param objectId
     * @param name
     * @param value - The value should generally be an object one of the following classes: String, Boolean, Integer, Double, Date, ObjectId, or a null
     * If the value is an ObjectId than it indicates that it is a reference to another object.
     * The data source can check isPersisted to see if the object has been persisted yet. If it is true than it means
     * it means it has already been persisted. If it is false, the object has not been persisted yet. If the data
     * source can handle a new object at this point, it should call ObjectId.persist to persist the object
     * @param attributes TODO
     * @throws Exception
     */
    void recordPropertyAddition(String objectId, String name, Object value, int attributes) throws Exception;
    /**
     * This is called when a property value is changed
     * @param objectId
     * @param name
     * @param value
     * @param attributes TODO
     * @throws Exception
     */
    void recordPropertyChange(String objectId, String name, Object value, int attributes) throws Exception;
    /**
     * This is called when a property value is removed
     * @param objectId
     * @param name
     * @throws Exception
     */
    void recordPropertyRemoval(String objectId, String name) throws Exception;
    /**
     * This is called when an object should be deleted
     * @param objectId
     * @param name
     * @throws Exception
     */
    void recordDelete(String objectId) throws Exception;
    /**
     * This is called when a new object is persisted
     * @return persister
     * @throws Exception
     */
    NewObjectPersister recordNewObject(Persistable object) throws Exception;
    
    void startTransaction() throws Exception;
    void commitTransaction() throws Exception;
    void abortTransaction() throws Exception;
}
