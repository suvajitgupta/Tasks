package org.persvr.remote;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Map;

import org.persvr.data.LazyPropertyId;
import org.persvr.data.Query;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.PersistableInitializer;
/**
 * Just a place holder data source for client generated objects, client created objects should be in the id map or not available
 * @author Kris Zyp
 *
 */
public class ClientData implements DataSource {
	public boolean hiddenId(String id) {
		return true;
	}

	String id;
	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		return null;
	}



	public void initParameters(Map<String,Object> parameters) throws Exception {
	}

	public void mapObject(PersistableInitializer initializer, String objectId)
			throws Exception {
		throw new RuntimeException("The client object was not found in the current session.");

	}



	public Collection<Object> query(Query query) throws Exception {
		return new ArrayList();
	}



	public String getId() {
		return id;
	}



	public void setId(String id) {
		this.id = id;
	}

	public void mapSchema(PersistableInitializer initializer) throws Exception {
		initializer.finished();
	}

}
