package org.persvr.datasource;

public interface RemoteDataSource {
	public Object query(String query) throws Exception;
}
