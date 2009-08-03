package org.persvr.data;


import org.mozilla.javascript.ScriptRuntime;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.RemoteDataSource;



/**
 *
 * @author Kris Zyp
 * This class represents a remote query
 */
public class RemoteQuery extends Identification<Object> {
	@Override
	protected Object resolveTarget() {
		throw new RuntimeException("getTarget should always be used for ObjectPath");
	}
	@Override
	public Object getTarget() {
		try {
			return ((RemoteDataSource) source).query(subObjectId);
		} catch (Exception e) {
			return ScriptRuntime.constructError("Error", e.getMessage());
		}
	}
	public static synchronized RemoteQuery idForObject(DataSource source, String objectId) {
		if (objectId == null)
			throw new RuntimeException("objectId can not be null");
		RemoteQuery query = new RemoteQuery();
		query.source = source;
		query.subObjectId = objectId;
		return query;
	}


}
