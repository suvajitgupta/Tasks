package org.persvr.data;

import org.persvr.datasource.DataSource;
/**
 * This represents a field that may be loaded later internally, but is not supposed to lazy
 * loaded for remote clients
 * @author Kris Zyp
 *
 */
public abstract class DeferredField extends LazyPropertyId {

	public DeferredField(DataSource source, String objectId, String field) {
		super(source, objectId, field);
	}

}
