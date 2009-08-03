package org.persvr.datasource;

import java.util.List;

import org.persvr.data.ObjectId;

public interface DataSourceCanHaveOrphans extends DataSource {
	public List<ObjectId> getOrphans();
	public void purgeOrphans();
}
