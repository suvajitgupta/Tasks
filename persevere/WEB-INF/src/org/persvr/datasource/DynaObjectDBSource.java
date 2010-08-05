package org.persvr.datasource;

import java.io.IOException;
import java.io.Reader;
import java.security.acl.Acl;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.sql.rowset.serial.SerialClob;

import org.apache.catalina.startup.SetContextPropertiesRule;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Token;
import org.mozilla.javascript.Undefined;
import org.persvr.data.DataSourceManager;
import org.persvr.data.DeferredField;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.PersevereLibrary;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.PersistableObject;
import org.persvr.data.Query;
import org.persvr.data.QueryCantBeHandled;
import org.persvr.data.Version;

/**
 * This is a SQL based object database source, that uses a row-per-property storage technique.
 * 
 * @author Kris
 * 
 */
public class DynaObjectDBSource extends DatabaseDataSource implements WritableDataSource, DataSource,ListDataSource,
		DataSourceCanHaveOrphans, ReferenceAwareDataSource, SourceDeleteAware {
	public NewObjectPersister recordNewObject(Persistable object) throws Exception {
		return recordNewObject(object, null);
	}
	private Log log = LogFactory.getLog(PersevereLibrary.class);
	NewObjectPersister recordNewObject(Persistable object, final ObjectId referrerId) throws Exception {
		DynaObjectDBSource nextSource = this;
		while(nextSource != null){
			if(nextSource.tableSize != -1)
				nextSource.tableSize++;
			nextSource = nextSource.superSource;
		}
		
		return new StartAsEmptyPersister() {
			Object acl = referrerId;
			boolean hasProperties = false;
			public Object getAcl() {
				return acl;
			}

			public ObjectId getParent() {
				return referrerId;
			}

			String newObjectId;

			public void start() throws Exception {
				newObjectId = Long.toString(getNextId() - startingId);

			}
			
			@Override
			public void finished() throws Exception {
				if(!hasProperties){
					recordPropertyAddition(newObjectId, ":exists", true, 0);
				}
			}

			@Override
			public void recordProperty(String name, Object value) throws Exception {
				hasProperties = true;
				super.recordProperty(name, value);
			}


			@Override
			public void initializeAsList(List<? extends Object> values) throws Exception {
				recordPropertyAddition(newObjectId, GlobalData.CONTAINS_REPEATING_IDENTIFIER, true, 0);
				super.initializeAsList(values);
			}

			public WritableDataSource getSource() {
				return DynaObjectDBSource.this;
			}

			public String getObjectId() {
				return newObjectId;
			}

			public boolean isHiddenId() {
				return "Array".equals(getId()) || "Object".equals(getId());
			}
		};

	}
	long tableSize = -1;
	public Collection<Object> query(Query query) throws Exception {
		boolean rootQuery = "".equals(query.subObjectId);
		StringBuffer sql;
		String selectPart;
		if (rootQuery){
			selectPart = "SELECT DISTINCT id as value, " + OBJECT_TYPE + " as value_type ";
			sql = new StringBuffer("FROM obj WHERE field != ':isDeleted' ");
		}
		else{
			selectPart = "SELECT value_type,value ";
			sql = new StringBuffer("FROM list WHERE list_id=" + query.subObjectId
					+ " AND value IN (SELECT id FROM obj WHERE field != ':isDeleted' ");
		}
		if (query.getCondition() != null)
			sql.append(" AND ").append(addConditionToQuery(query.getCondition()));
		if (query.getSort() != null)
			throw new QueryCantBeHandled();
		boolean useCachedCount = false;
		if (rootQuery){
			sql.append((sql.toString().endsWith("WHERE ") ? "": " AND ") + "id >= " + startingId + " AND id < "
					+ endingId);
			if(query.getCondition() == null){
				if (tableSize == -1){
					try {
						ResultSet rs = executeQuery("SELECT COUNT(DISTINCT id) " + sql);
						rs.next();
						tableSize = rs.getLong(1);
						rs.close();	
					} catch (SQLException e) {
						throw new RuntimeException(e);
					}
				}
				useCachedCount = true;
			}
		}
		else
			sql.append(')');
		return useCachedCount ? new QueryIterator(selectPart + sql, tableSize) : new QueryIterator(selectPart + sql, "SELECT COUNT(DISTINCT id) " + sql);
	}
	protected String addBooleanOperator(String operator, Node condition) throws SQLException{
		throw new QueryCantBeHandled("Can't do AND or OR expressions in SQL with the object database");
	}
	protected String comparison(Node expression, Node valueNode, int conditionType) {
		String operator = null;
		StringBuffer sql = new StringBuffer();
		String name = null;
		if (expression.getType() == Token.GETPROP && expression.getFirstChild().getType() == Token.GETPROP && expression.getFirstChild().getFirstChild().getType() == Token.THIS
					&& "id".equals(expression.getLastChild().getString())) {
			name = expression.getFirstChild().getLastChild().getString();
			sql.append("field='" + makeStringSQLSafe(name) + "'");
			if (valueNode.getType() != Token.STRING || (conditionType != Token.EQ && conditionType != Token.SHEQ))
				throw new QueryCantBeHandled("The id must be a string");
			Identification id = Identification.idForString(valueNode.getString());
			if (!(id instanceof ObjectId)){
				throw new QueryCantBeHandled("The id must be an object id");
			}
			if(!(id.source instanceof DynaObjectDBSource)){
				throw new QueryCantBeHandled("The id must be an object id of the object db");
			}
			sql.append(" AND value_type=" + OBJECT_TYPE + " AND value=" + ((DynaObjectDBSource)id.source).convertId(id.subObjectId));
			return sql.toString();
			
		}
		if (expression.getType() == Token.GETPROP && expression.getFirstChild().getType() == Token.THIS
				&& "id".equals(expression.getLastChild().getString())) {
			Identification id = Identification.idForString(valueNode.getString());
			if (!(id instanceof ObjectId)){
				throw new QueryCantBeHandled("The id must be an object id");
			}
			if(!(id.source instanceof DynaObjectDBSource)){
				throw new QueryCantBeHandled("The id must be an object id of the object db");
			}
			sql.append("id=" +  + ((DynaObjectDBSource)id.source).convertId(id.subObjectId));
			return sql.toString();
		}
		return super.comparison(expression, valueNode, conditionType);
	}
	protected String nameInQuery(String name){
		return "field='" + makeStringSQLSafe(name) + "'";
	}

	protected String numberComparisonInQuery(double value, String operator){
		if (value% 1 == 0) {
			return " AND value_type=" + INTEGER_TYPE +
				" AND value" + operator + value;
		} else {
			return stringComparisonInQuery("" + value, BIG_NUM);
		}
	}
	protected String stringComparisonInQuery(String str, int type){
		return " AND value_type=" + type + " AND value in (SELECT id FROM str WHERE value='" + makeStringSQLSafe(str) + "')";		
	}
	protected String stringComparisonInQuery(String str){
		return stringComparisonInQuery(str, STR);
	}

	public DynaObjectDBSource() {
		
	}
	static boolean idRangeTableCreated;
	@Override
	public void initParameters(Map parameters) throws Exception {
		super.initParameters(parameters);
		establishTables();
		String superType = (String) parameters.get("extends");	
		if (superType != null && !"".equals(superType)) 
			superSource = (DynaObjectDBSource) DataSourceManager.getSource(superType);
		if (!idRangeTableCreated)
			try {
				idRangeTableCreated= true;
				execute("CREATE TABLE id_ranges (name VARCHAR(32672),starting_id BIGINT, ending_id BIGINT, exclusive_ending_id BIGINT)");
			} catch (SQLException e){
				// it fails the table already exists
			}
		ResultSet rs= executeQuery("SELECT starting_id, ending_id, exclusive_ending_id FROM id_ranges WHERE name='" + getId() + "'");
		if (rs.next()){
			// preexisting table
			startingId = rs.getLong(1);
			endingId = rs.getLong(2);
			exclusiveEndingId = rs.getLong(3);
		}
		else{
			// this is a new data source, we need to make a partition for it
			long largestSize = 0;
			DynaObjectDBSource largestSource = null; // find the dyna with the largest section
			if (superSource != null) {
				for (DynaObjectDBSource dynaSource : superSource.subTypes) {
					if (dynaSource == superSource || dynaSource.subTypes.size() == 1) { // can only partition from the super type or non-subtyped peers 
						long size = dynaSource.exclusiveEndingId - dynaSource.currentId;
						if (size > largestSize) {
							largestSize = size;
							largestSource = dynaSource;
						}
					}
				}
			}
			if (largestSource == null) {
				// first one, this is the Object table
				startingId = 0;
				exclusiveEndingId = endingId = Long.MAX_VALUE;
			}
			else {
				startingId = largestSource.currentId + (long) (largestSize / 1.4);
				exclusiveEndingId = endingId = largestSource.exclusiveEndingId;
			}
			if (largestSource != null){
				// we always need to adjust our exclusive area
				largestSource.exclusiveEndingId = startingId;
				execute("UPDATE id_ranges SET exclusive_ending_id = " + startingId + " WHERE name = '" + largestSource.getId() + "'");
				if (largestSource != superSource) {
					// if it is a peer, we need to make room for it, if it is the super type, we just take a place in it
					largestSource.endingId = startingId;
					execute("UPDATE id_ranges SET ending_id = " + startingId + " WHERE name = '" + largestSource.getId() + "'");
				}
			}
				//DataSourceManager.modifySource(largestSource.getId(), settings);
			execute("INSERT INTO id_ranges (name,starting_id, ending_id, exclusive_ending_id) VALUES ('" +
					getId() + "'," + startingId + "," + endingId + "," + exclusiveEndingId + ")");
		}
		
		/*exclusiveEndingId = parameters.get("exclusiveEndingId");
		if (endingId == 0)
			endingId = Long.MAX_VALUE;
		if (exclusiveEndingId == 0)
			exclusiveEndingId = endingId;*/
		for(DataSource source : dynaStores){
			if(source.getId().equals(getId()))
				throw new RuntimeException("Table with duplicate name " + getId() + " can not be created");
		}
		dynaStores.add(this);
		subTypes.add(this);
		if (superType != null && !"".equals(superType)) {
			if (startingId < superSource.startingId)
				throw new RuntimeException("starting id is beyond the range of the super type");
			if (endingId > superSource.endingId)
				throw new RuntimeException("ending id is beyond the range of the super type");
			superSource.subTypes.add(this);
			if (startingId < superSource.exclusiveEndingId)
				superSource.exclusiveEndingId = startingId;
		}
		findMaxId();
	}

	public List<ObjectId> getOrphans() {
		throw new UnsupportedOperationException("not implemented yet");
	}
	DynaObjectDBSource superSource;
	Set<String> marked;
	Set<Persistable> hasPermission = new HashSet();

	private void mark(final ObjectId object, final ObjectId prototype) {
		//TODO: We need to be able to remove entries from alterations that are alterations of unreachable objects
		final boolean newlyVisited = marked.add(object.subObjectId);
		try {
			convertId(object.subObjectId); // throw a parse exception right away if it is not a number
			mapObject(new PersistableInitializer() {
				public void setVersion(Version version) {
					throw new UnsupportedOperationException("Not implemented yet");
				}
				public void setLastModified(Date lastModified) {
					throw new UnsupportedOperationException("Not implemented yet");
				}

				boolean prototypeExists = false;

				public void setSchema(Persistable structure) {
				}

				public void setCacheLevel(long time) {
				}

				public void initializeByPrototype(ObjectId prototypeId) {
					
				}

				public void finished() {
					if (!prototypeExists && prototype != null)
						try {
							recordPropertyAddition(object.subObjectId, "prototype", prototype, 0);
						} catch (SQLException e) {

						}
				}

				public Persistable getInitializingObject() {
					return null;
				}


				public void initializeList(Collection collection) {
					for(Object value : collection){
						if (newlyVisited && value instanceof ObjectId)
							mark((ObjectId) value, null);
					}
				}

				public void initializeObject(PersistableObject object) {
				}
				public void setProperty(String key, Object value, int attributes) {
					setProperty(key, value);
				}
				public void setProperty(String key, Object value) {
					try {
						if (newlyVisited && value instanceof ObjectId) {
							if ("prototype".equals(key) && prototype != null)
								prototypeExists = true;
							if ("history".equals(key)) {
							} else if ("parent".equals(key)) {
							}//	mark((DataObject) value,object);
							else
								mark((ObjectId) value, "structure".equals(key) || "constructor".equals(key) ? object : null);
						} else if (value instanceof ShortStringLookupPair) {
							ResultSet rs = null;
							PreparedStatement statement = getConnectionObject().stringLookup;
							statement.setLong(1, Long.parseLong(((LazyPropertyId) value).subObjectId));
							rs = statement.executeQuery();
							if (rs.next())
								if (decodeString(rs.getString("value")).indexOf("mthd") != -1)
									recordPropertyRemoval(object.subObjectId, key);
							rs.close();
						}
					} catch (NumberFormatException e) {
					} catch (Exception e) {
						e.printStackTrace();
					}
				}

				public void setAcl(Acl acl) {
				}

				public void setPersistentAcl(ObjectId aclId) {
				}

				public void setParent(ObjectId objectToInheritFrom) {
				}
			}, object.subObjectId);

		} catch (NumberFormatException e) {
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public synchronized void purgeOrphans() {
		//		 TODO: This is using mark and sweep, but it is not safe while other operations are happening, 
		//therefore now it can only be run on startup, but it needs to be implemented using a reference tracing algorithm so it can run concurrently

		try {
			marked = new HashSet();
			mark(ObjectId.idForObject(this, null), null);
			ResultSet rs = executeQuery("SELECT DISTINCT id FROM obj WHERE id >= " + startingId + 2 + " AND id < " + endingId);
			while (rs.next()) {
				long id = rs.getLong("id");
				if (!marked.contains("" + id)) {
					//TODO: This should be enabled if running in runtime:					if (sourceObjectMap.get(id) == null) {// It has to be garbage collected by Java as well, so we don't destroy an object that is newly created or being transferred
					log.info("Deleting " + id);
					ResultSet parentRs = executeQuery("SELECT value FROM obj WHERE field='parent' AND id = " + id);
					try {
						parentRs.next();
						long newParentId = parentRs.getLong(1);
						execute("UPDATE obj SET value=" + newParentId + " WHERE field='parent' AND value = " + id);
					} catch (SQLException e) {
						log.info(e.getMessage());
					}
					execute("DELETE FROM obj WHERE id = " + id);
				}
				//}
			}
			rs = executeQuery("SELECT DISTINCT list_id FROM list WHERE list_id >= " + startingId + 2 + " AND list_id < " + endingId);
			while (rs.next()) {
				long id = rs.getLong("list_id");
				if (!marked.contains("" + id)) {
					//					if (sourceObjectMap.get(id) == null) {// It has to be garbage collected by Java as well, so we don't destroy an object that is newly created or being transferred
					//System.err.println("Deleting " + id);
					execute("DELETE FROM list WHERE list_id = " + id);
					//				}
				}
			}
			rs.close();
			execute("DELETE FROM str WHERE id NOT IN (SELECT value FROM obj WHERE value_type=" + STR
					+ " UNION SELECT value FROM list WHERE value_type=" + STR + ")");
			marked = null;
			//	fixPermission();
		} catch (SQLException e) {
			throw new RuntimeException(e);
		}

	}

	ResultSet rs = null;
	ConnectionStatements setupConnection(Connection connection) throws SQLException {
		connection.setTransactionIsolation(Connection.TRANSACTION_READ_UNCOMMITTED);

		ConnectionStatements statements = new ConnectionStatements();
		statements.objectRetrieval = connection.prepareStatement("SELECT field,value_type,value FROM obj where id=?");
		statements.referrerLookup = connection.prepareStatement("SELECT id FROM obj where value=? AND value_type=" + OBJECT_TYPE
				+ " AND NOT field='parent' UNION SELECT list_id as id FROM LIST WHERE value=? AND value_type=" + OBJECT_TYPE);
		statements.allReferrerLookup = connection.prepareStatement("SELECT id FROM obj where value=? AND value_type=" + OBJECT_TYPE
				+ " UNION SELECT list_id as id FROM LIST WHERE value=? AND value_type=" + OBJECT_TYPE);
		statements.stringLookup = connection.prepareStatement("SELECT value FROM str where id=?");
		statements.bigStringLookup = connection.prepareStatement("SELECT value FROM big_str where id=?");
		statements.listRetrieval = connection.prepareStatement("SELECT value_type,value FROM list WHERE list_id=?");
		statements.selectRowId = connection.prepareStatement("SELECT row_id FROM list WHERE list_id=?");
		statements.insertRow = connection.prepareStatement("INSERT INTO list (list_id,value_type,value) values (?,?,?)");
		if (connection.getClass().getName().equals("org.hsqldb.jdbc.jdbcConnection")) {
			statements.stringCreation = connection.prepareStatement("INSERT INTO str (value) values (?)");
			statements.bigStringCreation = connection.prepareStatement("INSERT INTO big_str (id,value) values (?,?)");
		} else {
			statements.stringCreation = connection.prepareStatement("INSERT INTO str (value) values (?)", Statement.RETURN_GENERATED_KEYS);
			statements.bigStringCreation = connection
					.prepareStatement("INSERT INTO big_str (id,value) values (?,?)", Statement.RETURN_GENERATED_KEYS);
		}
		statements.updateProperty = connection.prepareStatement("UPDATE obj SET value_type=?,value=? WHERE id=? AND field=?");
		statements.propertyLookup = connection.prepareStatement("SELECT value_type,value FROM obj where id=? AND field=?");
		statements.findStringReference = connection.prepareStatement("SELECT id FROM obj where value=? AND value_type=" + STR);
		statements.removeString = connection.prepareStatement("DELETE FROM str WHERE id=?");
		statements.addProperty = connection.prepareStatement("INSERT  INTO obj (id,field,value_type,value) values (?,?,?,?)");

		return statements;
	}

	protected ConnectionStatements getConnectionObject() throws SQLException {
		return setupConnection(createConnection());
	}

	class ConnectionStatements {
		public PreparedStatement objectRetrieval;
		public PreparedStatement referrerLookup;
		public PreparedStatement allReferrerLookup;
		public PreparedStatement stringLookup;
		public PreparedStatement bigStringLookup;
		public PreparedStatement stringCreation;
		public PreparedStatement bigStringCreation;
		public PreparedStatement listRetrieval;
		public PreparedStatement selectRowId;
		public PreparedStatement insertRow;
		public PreparedStatement updateProperty;
		public PreparedStatement removeString;
		public PreparedStatement findStringReference;
		public PreparedStatement propertyLookup;
		public PreparedStatement addProperty;
		
	}

	String clientSession;
	/**
	 * id 0 is the root object id 1 is the super field object
	 */
	long currentId = 2; // the id for the next object to be created
	Object nextIdLock = new Object();
	public synchronized long getNextId() {
		synchronized(nextIdLock){
			if (currentId + 1 == exclusiveEndingId)
				throw new RuntimeException("Ran out of ids, the database is full");
			return currentId++;
		}
	}

	void findMaxId() throws SQLException {
		rs = executeQuery("SELECT MAX(id) as mx FROM obj WHERE id >= " + startingId + " AND id < " + exclusiveEndingId);
		if (rs.next())
			currentId = rs.getLong(1);
		rs.close();
		rs = executeQuery("SELECT MAX(value) as mx FROM obj WHERE value_type=" + OBJECT_TYPE + " AND value >= " + startingId + " AND value < "
				+ exclusiveEndingId);
		if (rs.next()) {
			long highPointer = rs.getLong(1);
			if (highPointer > currentId)
				currentId = highPointer;
		}
		if (currentId == 0)
			currentId = startingId;
		if (currentId < startingId)
			currentId = startingId;
		currentId++;
		rs.close();
	}

	private static int MAX_SHORT_STRING_LENGTH = 8000;

	private void setupRootObjects() throws SQLException {
		findMaxId();
		/*
		 * Map<String, Object> dataMap = getObjectMap(startingId); // this
		 * should be the data and it should be a list if (dataMap.get("instances") ==
		 * null) { setValue(ObjectId.idForObject(this, ""), 0, new ValueSetter() {
		 * public void setValue(int fieldType, long fieldValue) throws
		 * SQLException { executeUpdate("INSERT INTO obj
		 * (id,field,value_type,value) values (" + startingId + ",'data'," +
		 * fieldType + ',' + fieldValue + ')'); } });
		 *  } dataMap = getObjectMap(startingId + 1); // this should be the data
		 * and it should be a list if
		 * (!Boolean.TRUE.equals(dataMap.get(GlobalData.CONTAINS_REPEATING_IDENTIFIER))) {
		 * setValue(true, 1, new ValueSetter() { public void setValue(int
		 * fieldType, long fieldValue) throws SQLException {
		 * executeUpdate("INSERT INTO obj (id,field,value_type,value) values (" +
		 * (startingId + 1) + ",'" + GlobalData.CONTAINS_REPEATING_IDENTIFIER +
		 * "'," + fieldType + ',' + fieldValue + ')'); } }); }
		 */

	}

	void establishTables() throws SQLException {
		try {
			executeQuery("SELECT * FROM obj WHERE id = 0"); // just test to see if the table is setup
		} catch (Exception e) {
			//e.printStackTrace();
			LogFactory.getLog(DynaObjectDBSource.class).info("Creating new tables");
			// need to build the tables
			runStarterStatements();
			//setupRootObjects();
			/*
			 * The SQL for creating a dyna database should roughly be:
			 * 
			 * CREATE TABLE str ( id INT NOT NULL AUTO_INCREMENT, value
			 * MEDIUMTEXT, PRIMARY KEY(id) )
			 * 
			 * CREATE TABLE obj ( id INT NOT NULL, field INT NOT NULL,
			 * value_type TINYINT(4) NOT NULL, value INT NOT NULL, PRIMARY
			 * KEY(id, field) )
			 * 
			 * CREATE TABLE list ( list_id INT NOT NULL, row_id INT NOT NULL
			 * AUTO_INCREMENT, value_type TINYINT(4) NOT NULL, value INT NOT
			 * NULL, PRIMARY KEY(row_id),INDEX (list_id) )
			 */
			/*
			 * Moved to DataSources.json Statement statement =
			 * createConnection().createStatement(); statement.execute( "CREATE
			 * TABLE str (id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY," +
			 * "value VARCHAR(" + MAX_SHORT_STRING_LENGTH +")," + "PRIMARY
			 * KEY(id))"); statement.execute( "CREATE TABLE big_str (id
			 * INTEGER," + "value CLOB," + "PRIMARY KEY(id))");
			 * statement.execute("CREATE TABLE obj (" + "id INT NOT NULL," +
			 * "field VARCHAR(" + MAX_SHORT_STRING_LENGTH +") NOT NULL," +
			 * "value_type SMALLINT NOT NULL," + "value INT NOT NULL," +
			 * "PRIMARY KEY(id, field))");
			 * 
			 * statement.execute("CREATE TABLE list (\n"+ "list_id INT NOT
			 * NULL,\n"+ "row_id INT NOT NULL GENERATED ALWAYS AS IDENTITY,\n"+
			 * "value_type SMALLINT NOT NULL,\n"+ "value INT NOT NULL,\n"+
			 * "PRIMARY KEY(row_id))"); statement.execute("CREATE INDEX
			 * list_id_index ON list(list_id)"); statement.execute("CREATE INDEX
			 * OBJ_VALUE_INDEX ON OBJ(VALUE)"); statement.execute("CREATE INDEX
			 * LIST_VALUE_INDEX ON LIST(VALUE)");
			 */
		}
	}
	
	long createString(String value) throws SQLException {
		PreparedStatement statement = getConnectionObject().stringCreation;
		if (value.length() > MAX_SHORT_STRING_LENGTH) {
			String shortStr = value.substring(0, MAX_SHORT_STRING_LENGTH - PAST_STRING_MAX.length()) + PAST_STRING_MAX;
			statement.setString(1, shortStr);
			long generatedId = executeAndGetGeneratedKey(statement, "str");
			statement = getConnectionObject().bigStringCreation;
			statement.setLong(1, generatedId);
			statement.setClob(2, new SerialClob(value.toCharArray()));
			statement.execute();
			return generatedId;
		}
		statement.setString(1, value);
		return executeAndGetGeneratedKey(statement, "str");
	}

	int executeUpdate(final String sql) throws SQLException {
		Statement statement = createConnection().createStatement();
		return statement.executeUpdate(sql);

	}

	int executeUpdate(final String sql, final int autoGen) throws SQLException {
			Statement statement = createConnection().createStatement();
			return statement.executeUpdate(sql, autoGen);
	}




	final static int NULL_TYPE = 0;
	final static int OBJECT_TYPE = 1;
	final static int BOOLEAN_TYPE = 3;
	final static int INTEGER_TYPE = 4;
	final static int STR = 5;
	final static int LONG_STR = 6;
	final static int BIG_NUM = 7;

	static class ShortStringLookupPair extends DeferredField {
		ShortStringLookupPair(DataSource source, long valueId) {
			super(source, Long.toString(valueId), null);
		}
	}

	static class BigNumLookupPair extends DeferredField {
		BigNumLookupPair(DataSource source, long valueId) {
			super(source, Long.toString(valueId), null);
		}
	}

	protected Object getValueFromRs(ResultSet rs) throws SQLException {
		int type = rs.getInt("value_type");
		type = type & ~DONTENUM;
		long value = rs.getLong("value");
		switch (type) {
		case NULL_TYPE:
			return null;
		case OBJECT_TYPE:
			return convertToObjectId(value);
		case BOOLEAN_TYPE:
			return (value != 0) ? Boolean.TRUE : Boolean.FALSE;
		case INTEGER_TYPE:
			return value;
		case STR:
			return new ShortStringLookupPair(this, value);
		case BIG_NUM:
			return new BigNumLookupPair(this, value);
		}
		throw new RuntimeException("Unknown value type");
	}

	private void initializeList(PersistableInitializer initializer, final ResultSet rs) throws SQLException {
		List items = new ArrayList();
		while (rs.next()) {
			items.add(getValueFromRs(rs));
		}
		rs.close();
		initializer.initializeList(items);
	}/*
		 * initializer.initializeList(new Iterator() { short fetched = 0; public
		 * boolean hasNext() { try { if (fetched == 0) { fetched = (short)
		 * (rs.next() ? 1 : -1); if (fetched == -1) rs.close(); } return fetched ==
		 * 1; } catch (SQLException e) { return false; } }
		 * 
		 * public Object next() { try { if (fetched == 0) { if (!rs.next()) {
		 * rs.close(); fetched = -1; } } else if (fetched == 1) fetched = 0;
		 * else if (fetched == -1) throw new RuntimeException("Called next past
		 * the last item in the result set"); return getValueFromRS(rs); } catch
		 * (SQLException e) { throw new RuntimeException(e); } }
		 * 
		 * public void remove() { throw new UnsupportedOperationException(); }
		 * 
		 * }); }
		 */

	Map<String, Object> getObjectMap(long objectId) throws SQLException {
		ResultSet rs;
		PreparedStatement statement = getConnectionObject().objectRetrieval;
		statement.setLong(1, objectId);
		rs = statement.executeQuery();
		Map<String, Object> objectMap = new HashMap(4);
		String field;
		while (rs.next()) {
			field = rs.getString("field");
			objectMap.put(field, getValueFromRs(rs));
		}
		rs.close();
		return objectMap;
	}
	final static int DONTENUM = 0x10; 
	public void mapObject(PersistableInitializer initializer, String objectId) throws Exception {
		long longId = convertId(objectId);
		ResultSet rs;
		PreparedStatement statement = getConnectionObject().objectRetrieval;
		statement.setLong(1, longId);
		rs = statement.executeQuery();
		String field;
		boolean parentSet = false;
		boolean hasProperties = false;
		while (rs.next()) {
			hasProperties = true;
			field = rs.getString("field");
			if(GlobalData.CONTAINS_REPEATING_IDENTIFIER.equals(field)){
				PreparedStatement listRetrieval = getConnectionObject().listRetrieval;
				listRetrieval.setLong(1, longId);
				initializeList(initializer, listRetrieval.executeQuery());
				break;
			}
			Object value = getValueFromRs(rs);
			if (":isDeleted".equals(field)){
				throw new ObjectNotFoundException(this,objectId);
			}
			if ("parent".equals(field)){
				if(value instanceof ObjectId)
					initializer.setParent((ObjectId) value);
				else
					initializer.setParent((ObjectId) DataSourceManager.getRootObject().getId());
				parentSet = true;
			}
			else if (!":exists".equals(field)){
				int type = rs.getInt("value_type");
				initializer.setProperty(field, value, (type & DONTENUM) == DONTENUM ? ScriptableObject.DONTENUM : 0);
			}
		}
		rs.close();
		if(!hasProperties){
			// if no properties were found that means the object doesn't exist
			throw new ObjectNotFoundException(this,objectId);
		}
		if(!parentSet && (id.equals("Object") || id.equals("Array"))){
			List<ObjectId> referrers = getReferrers(objectId);
			if (!referrers.isEmpty())
				initializer.setParent(referrers.get(0));
		}
		initializer.finished();
	}


	private static final String PAST_STRING_MAX = "PAST$STRING$MAX";

	public Object getFieldValue(LazyPropertyId valueId) throws SQLException {
		ResultSet rs = null;
		PreparedStatement statement = getConnectionObject().stringLookup;
		statement.setLong(1, Long.parseLong(valueId.subObjectId));
		rs = statement.executeQuery();
		if (valueId instanceof BigNumLookupPair) {
			rs.next();
			Long newBigNum = new Long(rs.getString("value")); // TODO:need to make this work with the different types of numbers
			rs.close();
			return newBigNum;
		} else if (valueId instanceof ShortStringLookupPair) {
			if (rs.next()) {
				String str = rs.getString("value");
				if (str.endsWith(PAST_STRING_MAX)) {
					statement = getConnectionObject().bigStringLookup;
					statement.setLong(1, Long.parseLong(valueId.subObjectId));
					ResultSet bigRs = statement.executeQuery();
					bigRs.next();
					str = slurp(bigRs.getClob("value").getCharacterStream());
					bigRs.close();
				}

				Object value = convertStringToObject(decodeString(str));
				rs.close();
				return value;
			}
		}
		rs.close();
		throw new RuntimeException("Unable to find string for id " + valueId);
	}

	static List<DynaObjectDBSource> dynaStores = new ArrayList();

	private ObjectId convertToObjectId(long id) {

		//if (id < endingId && id >= startingId)
			//return ObjectId.idForObject(this, Long.toString(id - startingId));
		for (DynaObjectDBSource source : dynaStores)
			if (id < source.exclusiveEndingId && id >= source.startingId){
				return ObjectId.idForObject(source, Long.toString(id - source.startingId), "Array".equals(source.getId()) || "Object".equals(source.getId()));
			}
		throw new IndexOutOfBoundsException("out of bounds exception");
	}

	public List<ObjectId> getReferrers(String id) {
		long objectId = convertId(id);
		List<ObjectId> referrerList;
		try {
			PreparedStatement statement = getConnectionObject().referrerLookup;
			ResultSet rs;
			statement.setLong(1, objectId);
			statement.setLong(2, objectId);
			rs = statement.executeQuery();
			referrerList = new ArrayList();
			while (rs.next())
				referrerList.add(convertToObjectId(rs.getLong(1)));

			rs.close();
		} catch (SQLException e) {
			throw new RuntimeException(e);
		}
		return referrerList;

	}

	static interface ValueSetter {
		void setValue(int fieldType, long fieldValue) throws SQLException;
	}
	private NewObjectPersister recordNewObject(ObjectId value, ObjectId referrer) {
		try {
			WritableDataSource newObjectSource = ((WritableDataSource) DataSourceManager.getSourceByPrototype(((ObjectId)value).getTarget().getPrototype()));
			if (newObjectSource == null) {
				newObjectSource = (WritableDataSource) DataSourceManager.baseObjectSource;
			}
			if (newObjectSource instanceof DynaObjectDBSource)
				return ((DynaObjectDBSource) newObjectSource).recordNewObject(value.getTarget(), referrer);
			else
				return newObjectSource.recordNewObject(value.getTarget());
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
	void setValue(Object value, final long referrer, ValueSetter setter) throws SQLException {
		int fieldType = 0;
		long fieldValue = -1;
		if (value instanceof Persistable)
			value = ((Persistable) value).getId();
		if (value instanceof ObjectId) {
			ObjectId id = (ObjectId) value;
				id.persistIfNeeded(id.isPersisted() ? null
						: recordNewObject((ObjectId) value, convertToObjectId(referrer))); // persist into Object if we need to persist
			if (id.source instanceof DynaObjectDBSource && id.subObjectId != null && !"".equals(id.subObjectId)) {
				fieldType = OBJECT_TYPE;
				fieldValue = ((DynaObjectDBSource) id.source).convertId(id.subObjectId);
			} else
				value = convertObjectToString(value);
		} else if (value instanceof Integer) {
			fieldType = INTEGER_TYPE;
			fieldValue = ((Integer) value).intValue();
		} else if (value instanceof Long && ((Long) value).longValue() < Integer.MAX_VALUE) {
			fieldType = INTEGER_TYPE;
			fieldValue = ((Long) value).intValue();
		} else if (value instanceof Boolean) {
			fieldType = BOOLEAN_TYPE;
			fieldValue = (((Boolean) value).booleanValue() ? 1 : 0);
		} else if (value == null) {
			fieldType = NULL_TYPE;
		} else if (value instanceof Undefined) {
			throw new RuntimeException("Can not set undefined");
		} else {
			value = convertObjectToString(value);
		}
		if (value instanceof String) {
			fieldType = STR;
			fieldValue = createString((String) value);
		}
		setter.setValue(fieldType, fieldValue);
	}



	public void recordPropertyAddition(String id, final String key, Object value, final int attributes) throws SQLException {
		final long objectId = convertId(id);
		if (objectId == startingId && "instances".equals(key)) { // this is supposed to be fixed
			(((PersistableArray) value).getId()).persistIfNeeded(new StartAsEmptyPersister() {

				public String getObjectId() {
					return "";
				}
				public boolean isHiddenId() {
					return "Array".equals(getId()) || "Object".equals(getId());
				}
				public DataSource getSource() {
					return DynaObjectDBSource.this;
				}

			});
		}
		setValue(value, objectId, new ValueSetter() {
			public void setValue(int fieldType, long fieldValue) throws SQLException {
				PreparedStatement addProperty = getConnectionObject().addProperty;
				try{
					if((ScriptableObject.DONTENUM & attributes) == ScriptableObject.DONTENUM)
						fieldType += DONTENUM;
					addProperty.setInt(3, fieldType);
					addProperty.setLong(4, fieldValue);
					addProperty.setLong(1, objectId);
					addProperty.setString(2, key);
					addProperty.execute();
				}catch(SQLException e){
					System.err.println("trying to save fieldType:" +fieldType + " fieldValue " + fieldValue + " key " + key + " objectId " + objectId);
					throw e;
				}
			}
		});

	}
	Set<String> myCurrentWrites = new HashSet();
	static Set<String> currentWrites = new HashSet();
	public void recordPropertyChange(String id, final String key, Object value, final int attributes) throws SQLException {
		final long objectId = convertId(id);
		setValue(value, objectId, new ValueSetter() {
			public void setValue(int fieldType, long fieldValue) throws SQLException {
				ConnectionStatements statements = getConnectionObject();
				statements.propertyLookup.setLong(1, objectId);
				statements.propertyLookup.setString(2, key);
				ResultSet rs = statements.propertyLookup.executeQuery();
				long stringToRemove = -1;
				if (rs.next())
					if (rs.getInt("value_type") == STR)
						stringToRemove = rs.getLong("value");
				rs.close();
				if((ScriptableObject.DONTENUM & attributes) == ScriptableObject.DONTENUM)
					fieldType += DONTENUM;
				statements.updateProperty.setInt(1, fieldType);
				statements.updateProperty.setLong(2, fieldValue);
				statements.updateProperty.setLong(3, objectId);
				statements.updateProperty.setString(4, key);
				statements.updateProperty.execute();
				if (stringToRemove > -1) {
					// check to make sure it is not used else where
/*					statements.findStringReference.setLong(1, stringToRemove);
					rs = statements.findStringReference.executeQuery();
					if (!rs.next()){
					}
					rs.close();*/
					statements.removeString.setLong(1, stringToRemove);
					statements.removeString.execute();

				}
			}
		});
	}

	private long convertId(String id) {
		if (id == null)
			throw new RuntimeException("invalid id: " + id);
		if ("".equals(id))
			throw new RuntimeException("invalid id: " + id);
		try {
			long longId = Long.parseLong(id) + startingId;
			if (longId < (startingId) || longId >= currentId) { // the first two ids are only accessible through null and empty string
				throw new ObjectNotFoundException(this,id);
			}
			return longId;
		}
		catch (NumberFormatException e) {
			throw new ObjectNotFoundException(this,id);
		}
	}

	public void recordPropertyRemoval(String id, String name) throws SQLException {
		final long objectId = convertId(id);

		executeUpdate("DELETE FROM obj WHERE id=" + objectId + " and field='" + name + "'");
		PreparedStatement statement = getConnectionObject().objectRetrieval;
		statement.setLong(1, objectId);
		rs = statement.executeQuery();
		// record that it exists in case delete removes the last property
		if(!rs.next()) {
			recordPropertyAddition(id, ":exists", true, 0);
		}
	}

	/* List section */
	public void recordListAdd(final String objectId, int index, Object value) throws SQLException {
		throw new UnsupportedOperationException();
	}

	private Object get(String objectId, int index) {
		return ((List) ObjectId.idForObject(this, objectId).getTarget()).get(index);
	}

	public List testQuery(String sql) throws SQLException {
		ResultSet rs = executeQuery(sql);
		List results = new ArrayList();
		while (rs.next()) {
			int i = 0;
			List column = new ArrayList();
			results.add(column);
			try {
				while (i < 100) {
					i++;
					column.add(rs.getObject(i));

				}
			} catch (Exception e) {
			}
		}
		return results;
	}

/*	private long getRowId(long objectId, long index) throws SQLException {
		//testQuery("SELECT * FROM list WHERE list_id=23");
		PreparedStatement selectRowId = getConnectionObject().selectRowId;
		selectRowId.setLong(1, objectId);
		ResultSet rs = selectRowId.executeQuery();
		rs.next();
		for (int i = 0; i < index; i++)
			if (!rs.next())
				throw new IndexOutOfBoundsException();
		long rowId = rs.getLong(1);
		rs.close();
		return rowId;
	}

	private void recordListRemoval(String id, final int index) throws SQLException {
		final long objectId = convertId(id);
		executeUpdate("DELETE FROM list WHERE row_id=" + getRowId(objectId, index));
	}

	public void recordListReplace(String id, final int index, final Object value) throws SQLException {
		final long objectId = convertId(id);
		setValue(value, objectId, new ValueSetter() {
			public void setValue(final int fieldType, final long fieldValue) throws SQLException {
				executeUpdate("UPDATE list SET value_type=" + fieldType + ", value=" + fieldValue + " WHERE row_id=" + getRowId(objectId, index));
			}
		});
	}*/

	public void recordList(String id, List<? extends Object> values) throws SQLException {
		final long objectId = convertId(id);
		executeUpdate("DELETE FROM list WHERE list_id=" + objectId);
		for (Object value : values)
			setValue(value, objectId, new ValueSetter() {
				public void setValue(int fieldType, long fieldValue) throws SQLException {
					PreparedStatement statement = getConnectionObject().insertRow;
					statement.setLong(1, objectId);
					statement.setInt(2, fieldType);
					statement.setLong(3, fieldValue);
					statement.execute();
				}
			});

	}

/*	public void recordListRemoval(String id, Object value) throws SQLException {
		final long objectId = convertId(id);
		setValue(value, objectId, new ValueSetter() {
			public void setValue(int fieldType, long fieldValue) throws SQLException {
				executeUpdate("DELETE FROM list WHERE list_id=" + objectId + " AND value_type=" + fieldType + " AND value=" + fieldValue);
			}
		});

	}*/

	public void recordDelete(String objectId) throws Exception {
/*		List<ObjectId> referrers = getReferrers(objectId);
		referrers.remove(ObjectId.idForObject(this, objectId));//ignore circular references
		if (!referrers.isEmpty())
			throw new RuntimeException("Can not delete an object that is referenced");*/
		 // Delete it from any objects that reference this object
		// TODO: This first query is dangerous because it can violate schema contracts
		 //executeUpdate("DELETE FROM obj where value=" + objectId + " AND value_type=" + OBJECT_TYPE); // Delete it from any lists that usethis object 
		  //executeUpdate("DELETE FROM list where value=" + objectId + " AND value_type=" + OBJECT_TYPE); // Delete the object properties
		  executeUpdate("DELETE FROM obj where id=" + convertId(objectId)); // Delete the object list items
		  executeUpdate("DELETE FROM list where list_id=" + convertId(objectId));
		  recordPropertyAddition(objectId, ":isDeleted", true, 0);
		DynaObjectDBSource nextSource = this;
		while(nextSource != null){
			if(nextSource.tableSize != -1)
				nextSource.tableSize--;
			nextSource = nextSource.superSource;
		}
		
	}

	private void shorten(ResultSet rs, long newLength) throws Exception {
		int i = 0;
		while (rs.next()) {
			long rowId = rs.getLong(1);
			i++;
			if (i > newLength)
				executeUpdate("DELETE FROM list WHERE row_id=" + rowId);
		}
		rs.close();
	}

	public void truncate(String objectId, long newLength) throws Exception {
		PreparedStatement selectRowId = getConnectionObject().selectRowId;
		selectRowId.setLong(1, Long.parseLong(objectId));
		shorten(selectRowId.executeQuery(), newLength);
	}

	private static String slurp(Reader in) {
		try {
			StringBuffer out = new StringBuffer();
			char[] b = new char[4096];
			for (int n; (n = in.read(b)) != -1;) {
				out.append(new String(b, 0, n));
			}
			return out.toString();
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}


	long startingId;
	long endingId; // end of all the objects of this type, including subtypes
	long exclusiveEndingId; // end of objects that are exactly of this type and not a subtype
	/*
	 * (non-Javadoc)
	 * 
	 * @see org.persvr.datasource.SpawningDataSource#newSource()
	 */
	List<DynaObjectDBSource> subTypes = new ArrayList<DynaObjectDBSource>(); // includes self
	public Map<String, Object> newSource() throws Exception {
		Map<String, Object> settings = new HashMap<String, Object>();
		settings.put("extends", getId());
		return settings;
	}
	public void onDelete() throws Exception {
		// need to delete all the sub types as well
		for (DataSource source : subTypes) {
			if (source != this)
				DataSourceManager.deleteSource(source.getId());
		}
		
		// reclaim id space
		for (DynaObjectDBSource source : dynaStores) {
			source.tableSize = -1; // clear the cache
			if (source.subTypes.indexOf(this)!= -1) {
				if (source.exclusiveEndingId == startingId)
					source.exclusiveEndingId = endingId;
				break;
			}
		}
		dynaStores.remove(this);
		// delete the objects
		execute("DELETE FROM obj WHERE id >= " + startingId + " AND id < " + endingId);
		execute("DELETE FROM list WHERE list_id >= " + startingId + " AND list_id < " + endingId);
		execute("DELETE FROM id_ranges WHERE name = '" + getId() + "'");
	}

	public DynaObjectDBSource getSuperSource() {
		return superSource;
	}
	@Override
	public String toString() {
		return "DataSource: " + getId();
	}
	@Override
	void setupStatements() {
		throw new UnsupportedOperationException("Not implemented yet");
	}


}
