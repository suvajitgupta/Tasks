package org.persvr.datasource;

import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.AbstractCollection;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;

import org.mozilla.javascript.Node;
import org.mozilla.javascript.Token;
import org.persvr.data.DataSourceManager;
import org.persvr.data.ObjectId;
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
	public static interface DatabaseAction {
		public Object execute() throws SQLException;
	}
	public static abstract class ThreadSpecificConnectionObject {
		protected Connection connection;
		public Connection getConnection() {
			return connection;
		}
		public void setConnection(Connection connection) {
			this.connection = connection;
		}
	}
	String username;
	String password;
	List<String> starterStatements;
	protected void runStarterStatements() throws SQLException {
		Statement statement = createConnection().createStatement();
		for (String starterStatement : starterStatements){
			statement.execute(starterStatement);
		}
		statement.close();
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
	    	this.threadMap = source.threadMap;
	    	return;
    	}
    	this.jndiName = (String) parameters.get("datasourceRef");
    	this.initialContextClass = (String) parameters.get("initialContext");
    	if (parameters.containsKey("connection"))
    		this.connectionString = (String) parameters.get("connection");
    	if (parameters.containsKey("username"))
    		this.username = (String) parameters.get("username");
    	if (parameters.containsKey("password"))
    		this.password = (String) parameters.get("password");
    	if (parameters.containsKey("starterStatements")) {
    		starterStatements = new ArrayList();
    		List<String> array = (List<String>) parameters.get("starterStatements");
    		for (int i = 0; i < array.size(); i++)
    			starterStatements.add(array.get(i));
    	}

    	if (parameters.containsKey("driver"))
    		Class.forName((String) parameters.get("driver"));
    	
    	if (parameters.containsKey("characterSet")) {
	    	this.needConversion = true;
	    	this.characterSet = (String) parameters.get("characterSet");
    	}
	}
    protected String connectionString;
    protected String jndiName;
    protected String initialContextClass;
    /** 
     * This method will be called each time a new connection is needed, 
     * implementators can store prepared statements along with the connection. 
     * Each connection object is thread specific, it should not be shared across 
     * sessions and accessing it through getConnectionObject will keep it thread specific.
     * @param connection
     * @return
     */
    abstract ThreadSpecificConnectionObject setupConnection(Connection connection) throws SQLException;
    Map<Thread,ThreadSpecificConnectionObject> threadMap = new WeakHashMap();
    
    /**
     * This will return a thread specific connection object. It will create a new one if necessary
     * @return
     * @throws SQLException
     */
    protected ThreadSpecificConnectionObject getConnectionObject() {
    	return getConnectionObject(false);
    }
    protected Connection createConnection() throws SQLException {
    	if(jndiName != null){
    		javax.sql.DataSource ds;
			try {
				Hashtable params = null;
				if (this.initialContextClass != null) {
					params = new Hashtable();
					params.put(Context.INITIAL_CONTEXT_FACTORY, this.initialContextClass);
				}
				InitialContext ctx = new InitialContext(params);
				ds = (javax.sql.DataSource) ctx.lookup(jndiName);
	    		return ds.getConnection();
			} catch (NamingException e) {
				throw new RuntimeException(e);
			}
    	}
    	while (true) {
	    	try {
	    		if (username == null) {
	    			return DriverManager.getConnection(connectionString);
	    		}
	    		else
	    			return DriverManager.getConnection(connectionString,username,password);
	    		/* TODO: Do this if it is mysql: 
	    		 *         ResultSet rs = executeQuery("show variables like \"character_set_database\"");
        if (rs.next())
        	characterSet = rs.getString(2);        
        rs.close();
        needConversion = !("UTF8".equals(characterSet.toUpperCase()));
		return super.setupConnection(connection);

	    		 */
	    	}
	    	catch (SQLException e) { // sometimes the process is still in use from last time it was run, so if wait a sec, it should become available
	    		if (e.getMessage().indexOf("already in use") != -1) {
	    			System.err.println(e.getMessage());
	    			System.err.println("Will wait to see if it becomes available");
	    			try {
						Thread.sleep(1000);
					} catch (InterruptedException e1) {
						e1.printStackTrace();
					}
	    		}
	    		else
	    			throw e;
	    	}
    	}
    	
    }
    ThreadSpecificConnectionObject getConnectionObject(boolean forceNew) {
    	ThreadSpecificConnectionObject connectionObject = threadMap.get(Thread.currentThread());
    	if (connectionObject == null || forceNew) {
        	try {
        		Connection connection = createConnection();
        		connectionObject = setupConnection(connection);
        		connectionObject.setConnection(connection);
        	}
        	catch (SQLException e) {
        		throw new RuntimeException(e);
        	}
    		threadMap.put(Thread.currentThread(), connectionObject);
    	}
    	return connectionObject;
    }
	/**
	 * This will attempt to perform the given action. If it fails, it will try to create a new connection and try again.
	 * @param action
	 * @throws SQLException
	 */
	public Object tryExecution(DatabaseAction action) throws SQLException {
		try {
			return action.execute();
		}
		catch (SQLException e) {
			getConnectionObject(true);
			return action.execute();
		}
	}
	Object executeAndGenerateLock = new Object();
	public long executeAndGetGeneratedKey(PreparedStatement statement, String tableName) throws SQLException {
		ResultSet rs;
		synchronized(executeAndGenerateLock){
			if (getConnectionObject().getConnection().getClass().getName().equals("org.hsqldb.jdbc.jdbcConnection")) {
				statement.execute();
		    	statement = getConnectionObject().getConnection().prepareStatement("CALL IdENTITY()");
		    	// derby: IDENTITY_VAL_LOCAL
		        rs = statement.executeQuery();
			}
			else if (getConnectionObject().getConnection().getClass().getName().equals("org.apache.derby.impl.jdbc.EmbedConnection40")) {
				statement.execute();
		    	statement = getConnectionObject().getConnection().prepareStatement("select IDENTITY_VAL_LOCAL() from " + tableName);
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
		return (ResultSet) tryExecution(new DatabaseAction() {
			public Object execute() throws SQLException {
				Statement statement = getConnectionObject().getConnection().createStatement();
				Object value = statement.executeQuery(sql);
				return value;
			}
		});
	}

	boolean execute(final String sql) throws SQLException {
		return (Boolean) tryExecution(new DatabaseAction() {
			public Object execute() throws SQLException {
				Statement statement = getConnectionObject().getConnection().createStatement();
				return statement.execute(sql);
			}
		});

	}
	public void commitTransaction() throws SQLException {
		getConnectionObject().getConnection().commit();
		getConnectionObject().getConnection().setAutoCommit(true);
	}

	public void startTransaction() throws SQLException {
		tryExecution(new DatabaseAction() {
			public Object execute() throws SQLException {
				getConnectionObject().getConnection().setAutoCommit(false);
				return null;
			}
		});
	}

	public void abortTransaction() throws SQLException {
		try{
			getConnectionObject().getConnection().rollback();
		} finally {
			getConnectionObject().getConnection().setAutoCommit(true);
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
	ResultSet executePagedQuery(String query, long start, long length) throws SQLException {
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
		int fetched = 0;
		boolean inUse;
		String fullQuery, countQuery;
		long nextPageStart;
		ResultSet rs;
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
		@Override
		protected void finalize() throws Throwable {
			try {
				if (rs != null)
					rs.close();
			} catch (SQLException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
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
				needsRsNext = false;
				inUse = true;
				if (rs == null){
					if(supportsPagedResults()){
						rs = executePagedQuery(fullQuery, nextPageStart, 50);
						nextPageStart += 50;
					}
					else
						rs =executeQuery(fullQuery);
				}
				boolean more = rs.next();
				if (more){
					fetched++;
				}
				else{
					if(supportsPagedResults() && fetched == nextPageStart) {
						rs = null;
						return hasNext();
					}
					else
						rs.close();
				}
				
				return more;
			}
			catch(SQLException e){
				try {
					// connection must have closed, we will try to open it again
					if(supportsPagedResults()){
						rs = executePagedQuery(fullQuery, nextPageStart, 50);
						nextPageStart += 50;
					}
					else
						rs =executeQuery(fullQuery);
					// get back to where we were
					for (int i = 0; i < fetched; i++){
						if (!rs.next())
							return false;
					}
					boolean more = rs.next();
					fetched++;
					if (!more){
						if(supportsPagedResults() && fetched == nextPageStart) {
							rs = null;
							return hasNext();
						}
						else
							rs.close();
					}
					return more;
				} catch (SQLException e1) {
					throw new RuntimeException(e);
				}
			}
		}
		public Object next() {
			ObjectId rowId;
			try {
				if(needsRsNext)
					hasNext();
				needsRsNext = true;
				return getValueFromRs(rs);
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
		}
		public int size() {
			if (count == -1) {
				try {
					ResultSet rs = executeQuery(countQuery);
					rs.next();
					count = rs.getLong(1);
					rs.close();	
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















