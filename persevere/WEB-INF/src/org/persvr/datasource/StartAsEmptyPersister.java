package org.persvr.datasource;

import java.util.List;

import org.persvr.data.GlobalData;
import org.persvr.data.ObjectId;
import org.persvr.security.SystemAcls;
/**
 * This class provides an implementation of NewObjectPersister that will allow a data source to start with an 
 * empty new object, and then add properties to it to initialize it. The getSource and getObjectId will be called prior (and afterwards) to
 * the initialize and record functions are called
 * @author Kris Zyp
 */
public abstract class StartAsEmptyPersister implements NewObjectPersister {
	public boolean reloadFromSource() {
		return false;
	}


	public void finished() throws Exception {
		// there is nothing to do because all the initialization is just additions to an empty object
	}

	public void initializeAsList(List<? extends Object> values) throws Exception {
		ListDataSource source = (ListDataSource) getSource();
		String objectId = getObjectId();
		source.recordList(objectId, values);
	}

	public void recordProperty(String name, Object value) throws Exception{
		WritableDataSource source = (WritableDataSource) getSource();
		String objectId = getObjectId();
		source.recordPropertyAddition(objectId, name, value, 0);
	}


	public ObjectId getParent() {
		return null;
	}


	public void start() throws Exception {
	}

}
