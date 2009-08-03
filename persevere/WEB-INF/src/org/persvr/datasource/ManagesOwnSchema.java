package org.persvr.datasource;
/**
 * Marker interface indicating that the DataSource will manage it's own schema. All requests
 * for mapping the schema and changes to the schema will be represented by an objectId
 * of <code>null</code>.
 * @author Kris
 *
 */
public interface ManagesOwnSchema extends DataSource {

}
