package org.persvr.datasource;

import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.AbstractCollection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;

import org.apache.commons.dbcp.BasicDataSource;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.Token;
import org.persvr.data.DataSourceManager;
import org.persvr.data.QueryCantBeHandled;
import org.persvr.remote.Client;
import org.persvr.remote.Client.RequestFinishListener;
import org.persvr.util.StringEncoder;
/**
 * 
 * @author Kris Zyp
 * This provides a default starting implementation for JDBC database sources
 */
public abstract class DatabaseDataSource extends BaseDataSource {
	javax.sql.DataSource pooledDataSource;
	Map<String, javax.sql.DataSource> pooledDataSources = new HashMap<String, javax.sql.DataSource>(); 
	protected ThreadLocal<Connection> transactionConnection = new ThreadLocal<Connection>();
			
	String username;
	String password;
	List<String> starterStatements;
	protected void runStarterStatements() throws SQLException {
		Connection conn = createConnection();
		Statement statement = conn.createStatement();
		for (String starterStatement : starterStatements){
			statement.execute(starterStatement);
		}
		statement.close();
		conn.close();
	}
	
    public void initParameters(Map<String,Object> parameters) throws Exception {
    	if (parameters.containsKey("extends")) {
    		String sharedConnection = (String) parameters.get("extends");
    		DatabaseDataSource source = (DatabaseDataSource) DataSourceManager.getSource(sharedConnection);
    		this.connectionString = source.connectionString;
    		this.username = source.username;
    		this.password = source.password;
	    	this.needConversion = false;
	    	this.characterSet = source.characterSet;
	    	return;
    	}
    	this.jndiName = (String) parameters.get("datasourceRef");
    	this.initialContextClass = (String) parameters.get("initialContext");
    	if(jndiName != null){
    		pooledDataSource = lookupDatasource();
    	}
    	else{
	    	if (parameters.containsKey("starterStatements")) {
	    		starterStatements = new ArrayList();
	    		List<String> array = (List<String>) parameters.get("starterStatements");
	    		for (int i = 0; i < array.size(); i++)
	    			starterStatements.add(array.get(i));
	    	}
	    	if (parameters.containsKey("connection"))
	    		this.connectionString = (String) parameters.get("connection");
	    	if (parameters.containsKey("username"))
	    		this.username = (String) parameters.get("username");
	    	String poolKey = connectionString + '-' + username;
    		if(pooledDataSources.containsKey(poolKey)){
    			pooledDataSource = pooledDataSources.get(poolKey);
    		}
    		else {
		    	if (parameters.containsKey("password"))
		    		this.password = (String) parameters.get("password");
		
		    	if (parameters.containsKey("driver"))
		    	pooledDataSource = new BasicDataSource();
		    	pooledDataSources.put(poolKey, pooledDataSource);
		    	if (parameters.containsKey("driver"))
		    		((BasicDataSource)pooledDataSource).setDriverClassName(parameters.get("driver").toString());
		    	((BasicDataSource)pooledDataSource).setUsername(username);
		    	((BasicDataSource)pooledDataSource).setPassword(password);
		    	((BasicDataSource)pooledDataSource).setUrl(connectionString);
		    	((BasicDataSource)pooledDataSource).setMaxWait(1000);
    		}
    	}
    	
    	if (parameters.containsKey("characterSet")) {
	    	this.needConversion = true;
	    	this.characterSet = (String) parameters.get("characterSet");
    	}
	}
    
    protected String connectionString;
    protected String jndiName;
    protected String initialContextClass;
    
	protected String loadTableStatement;
	protected String loadRowStatement;
	protected String deleteRowStatement;
	protected String insertRowStatement;
	
	abstract void setupStatements();
    
    protected javax.sql.DataSource lookupDatasource() throws NamingException {
		Hashtable params = null;
		if (this.initialContextClass != null) {
			params = new Hashtable();
			params.put(Context.INITIAL_CONTEXT_FACTORY, this.initialContextClass);
		}
		InitialContext ctx = new InitialContext(params);
		return (javax.sql.DataSource) ctx.lookup(jndiName);
    }
    
    protected Connection createConnection() throws SQLException {
    	return pooledDataSource.getConnection();
    }
    
	Object executeAndGenerateLock = new Object();
	// Executed in a transaction context?
	public long executeAndGetGeneratedKey(PreparedStatement statement, String tableName) throws SQLException {
		ResultSet rs;
		synchronized(executeAndGenerateLock) {
			Connection conn = transactionConnection.get();
			if (conn.getClass().getName().equals("org.hsqldb.jdbc.jdbcConnection")) {
				statement.execute();
		    	statement = conn.prepareStatement("CALL IdENTITY()");
		    	// derby: IDENTITY_VAL_LOCAL
		        rs = statement.executeQuery();
			}
			else if (conn.getClass().getName().equals("org.apache.derby.impl.jdbc.EmbedConnection40")) {
				statement.execute();
		    	statement = conn.prepareStatement("select IDENTITY_VAL_LOCAL() from " + tableName);
		        rs = statement.executeQuery();
			}
			else {
				statement.execute();
				rs = statement.getGeneratedKeys();
			}
	        long key;
	        if (rs.next()) {
	            key = rs.getLong(1);
	            rs.close();
	        }
	        else {
	        	rs.close();
	        	throw new RuntimeException("No new unique key was generated from creating a new object");
	        }
	        return key;
		}
	}
    
	static StringEncoder stringEncoder = new StringEncoder();
    static {
        stringEncoder.setUnsafeStrings(new String[] {"'"},new String[] {"''"});
    }
    String makeStringSQLSafe(String str) {
		str = encodeString(stringEncoder.encode(str));
    	return str;
    } 
    String characterSet = "latin1";
	boolean needConversion = false;
    String decodeString(String value) {
    	if (needConversion)
			try {
				value = new String(value.getBytes(characterSet),"UTF-8");
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
			}
		return value;
    }
    
    String encodeString(String value) {
    	if (needConversion)
			try {
				value = new String(value.getBytes("UTF-8"),characterSet);
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
			}
		return value;
    }
	ResultSet executeQuery(final String sql) throws SQLException {
		Connection conn = createConnection();
		try{
			return executeQuery(conn, sql);
		}
		finally{
			conn.close();
		}
	}    
	boolean execute(final String sql) throws SQLException {
		Connection conn = createConnection();
		try{
			return execute(conn, sql);
		}
		finally{
			conn.close();
		}
	}
	ResultSet executeQuery(Connection conn, final String sql) throws SQLException {
		Statement statement = conn.createStatement();
		return statement.executeQuery(sql);
	}

	boolean execute(Connection conn, final String sql) throws SQLException {
		Statement statement = conn.createStatement();
		return statement.execute(sql);
	}
	
	public void commitTransaction() throws SQLException {
		Connection conn = transactionConnection.get();
		if (conn == null) {
			throw new SQLException("transactionConnection is not valid in call to commitTransaction!");
		}
		try {
			conn.commit();
		}
		finally {
			conn.setAutoCommit(true);
			try {
				conn.close();
			}
			finally {
				transactionConnection.remove();
			}
		}
	}

	public void startTransaction() throws SQLException {
		if (transactionConnection.get() != null) {
			throw new SQLException("Only one transaction can be active for a DatabaseDataSource!");
		}
		Connection conn = createConnection();
		conn.setAutoCommit(false);
		transactionConnection.set(conn);
	}

	public void abortTransaction() throws SQLException {
		Connection conn = transactionConnection.get();
		if (conn == null) {
			throw new SQLException("transactionConnection is not valid in call to abortTransaction!");
		}
		try{
			conn.rollback();
		} finally {
			conn.setAutoCommit(true);
			try {
				conn.close();
			}
			finally {
				transactionConnection.remove();
			}
		}
	}
	
	protected String comparison(Node expression, Node valueNode, int conditionType) {
		String operator = null;
		StringBuffer sql = new StringBuffer();
		String name = null;
		if (expression.getType() == Token.GETPROP || expression.getType() == Token.GETELEM) {
			if (expression.getLastChild().getType() == Token.STRING && expression.getFirstChild().getType() == Token.THIS)
				name = expression.getLastChild().getString();
		}

		if (name == null)
			throw new QueryCantBeHandled("The first operand in a comparison must be a simple property of the form @.property");
		if ("id".equals(name))
			return "id=" + new Long(valueNode.getString());
		int fieldType;
		Object value = null;
		switch (conditionType) {
			case Token.EQ:
			case Token.SHEQ:
				operator = "=";
				break;
			case Token.NE:
			case Token.SHNE:
				operator = "!=";
				break;
			case Token.GE:
				operator = ">=";
				break;
			case Token.GT:
				operator = ">";
				break;
			case Token.LE:
				operator = "<=";
				break;
			case Token.LT:
				operator = "<";
				break;
		}
		sql.append(nameInQuery(name));
		switch (valueNode.getType()) {
			case Token.NUMBER:
				sql.append(numberComparisonInQuery(valueNode.getDouble(),operator));
				break;
			case Token.STRING:
				
				if (valueNode.getType() == Token.STRING) {
					value = valueNode.getString();
				}
				// fall through for big num
				if (!"=".equals(operator) && !"!=".equals(operator))
					throw new QueryCantBeHandled("Can only do equal comparison with strings");
				sql.append(stringComparisonInQuery((String)value));
				break;
			default:
				throw new QueryCantBeHandled("Unknown token");
		}
		return sql.toString();
	}
	protected abstract String nameInQuery(String name);
	protected String numberComparisonInQuery(double number, String operator){
		return operator + number;
	}
	protected String stringComparisonInQuery(String str){
		return "='" + makeStringSQLSafe(str) + "'";
	}
	protected String addBooleanOperator(String operator, Node condition) throws SQLException{
		StringBuffer sql = new StringBuffer();
		sql.append("(" + addConditionToQuery(condition.getFirstChild()));
		sql.append(operator == null ? " OR " : " AND "); // TODO: add alternate operators
		sql.append(addConditionToQuery(condition.getLastChild()) + ")");
		return sql.toString();
	}
	/**
	 * Converts a JSONPath/JavaScript AST condition to SQL 
	 * @param condition
	 * @return
	 * @throws SQLException
	 */
	protected String addConditionToQuery(Node condition) throws SQLException {
		StringBuffer sql = new StringBuffer();
		String operator = null;
		switch (condition.getType()) {
			case Token.AND:
			case Token.BITAND:
				operator = " AND ";
			case Token.OR:
			case Token.BITOR:
				return addBooleanOperator(operator, condition);
			case Token.EQ:
			case Token.NE:
			case Token.GE:
			case Token.GT:
			case Token.LE:
			case Token.LT:
			case Token.SHEQ:
			case Token.SHNE:
				try {
					return comparison(condition.getFirstChild(), condition.getLastChild(), condition.getType());
				} catch (QueryCantBeHandled e) {
					// try it the other way then
					return comparison(condition.getLastChild(), condition.getFirstChild(), condition.getType());
				}
			default:
				throw new QueryCantBeHandled();
		}
	}

	boolean supportsPagedResults(){
		return false;
	}
	
	ResultSet executePagedQuery(Connection conn, String query, long start, long length) throws SQLException {
		return null;
	}
	
	/**
	 * This is a lazy loading iterator that will load results from a result
	 * set as needed. It is also capable of rerunning a query if the result
	 * set is closed
	 * @author Kris
	 *
	 */
	public class QueryIterator extends AbstractCollection implements Iterator, RequestFinishListener {
		String fullQuery, countQuery;
		long nextPageStart;
		int pageIndex;
		ResultSet rs;
		List currentPage = new ArrayList();
		long count = -1;
		
		QueryIterator(String fullQuery, String countQuery){
			// close the connection after the request response is finished
			Client.IndividualRequest request = Client.getCurrentObjectResponse();
			if (request != null)
				request.addFinishListener(this);
			this.fullQuery = fullQuery;
			this.countQuery = countQuery;
		}
		
		QueryIterator(String fullQuery, long count){
			// close the connection after the request response is finished
			Client.IndividualRequest request = Client.getCurrentObjectResponse();
			if (request != null)
				request.addFinishListener(this);
			this.fullQuery = fullQuery;
			this.count = count;
		}

		
		public void onFinish(){
			try {
				finalize();
			} catch (Throwable e) {
				e.printStackTrace();
			}
		}
		
		boolean needsRsNext = true;
		
		public boolean hasNext() {
			try {
				if(pageIndex == 0 || (pageIndex == 50 && supportsPagedResults())){ 
					pageIndex = 0;
					currentPage.clear();
					Connection conn = createConnection();
					try{
						if(supportsPagedResults()){
							rs = executePagedQuery(conn, fullQuery, nextPageStart, 50);
							nextPageStart += 50;
						}
						else
							rs = executeQuery(conn, fullQuery);
						while(rs.next()){
							currentPage.add(getValueFromRs(rs));
						}
						rs.close();
					}
					finally{
						conn.close();
					}
				}
				return pageIndex < currentPage.size();
			}
			catch(Exception e){
				throw new RuntimeException(e);
			}
		}
		
		public Object next() {
			return currentPage.get(pageIndex++);
		}
		
		public int size() {
			if (count == -1) {
				try {
					Connection conn = createConnection();
					try{
						ResultSet rs = executeQuery(conn, countQuery);
						rs.next();
						count = rs.getLong(1);
						rs.close();
					}
					finally{
						conn.close();
					}
				} catch (SQLException e) {
					throw new RuntimeException(e);
				}
			}
			return (int) count;			
		}

		public void remove() {
			throw new UnsupportedOperationException("Not  implemented yet");
		}
		@Override
		public Iterator iterator() {
			return this;
		}
	}
	
	/**
	 * This gets the value/object for the current result set row
	 * @param rs
	 * @return
	 * @throws Exception
	 */
	protected abstract Object getValueFromRs(ResultSet rs) throws Exception;
}
