package org.persvr.datasource;

import java.util.List;

import org.persvr.data.ObjectId;

public interface ReferenceAware {
	public List<ObjectId> getReferrers();
	@Deprecated
	public List<ObjectId> getAllReferrers();
}
