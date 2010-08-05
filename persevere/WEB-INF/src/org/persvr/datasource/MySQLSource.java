package org.persvr.datasource;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;

public class MySQLSource extends DatabaseTableDataSource {

	@Override
	ResultSet executePagedQuery(Connection conn, String query, long start, long length) throws SQLException {
		return executeQuery(conn, query + " LIMIT " + length + " OFFSET " + start);
	}

	@Override
	boolean supportsPagedResults() {
		return true;
	}

}
