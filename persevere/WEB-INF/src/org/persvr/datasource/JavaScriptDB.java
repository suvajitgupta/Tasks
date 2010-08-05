package org.persvr.datasource;

import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInput;
import java.io.DataOutput;
import java.io.DataOutputStream;
import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.lang.ref.Reference;
import java.lang.ref.SoftReference;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.data.BinaryData;
import org.persvr.data.DataSourceHelper;
import org.persvr.data.DataSourceManager;
import org.persvr.data.FunctionUtils;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.Method;
import org.persvr.data.NewObjectId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.PersistableObject;
import org.persvr.data.Query;
import org.persvr.data.Transaction;
import org.persvr.data.Version;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.AliasIds;
import org.persvr.security.UserSecurity;
import org.persvr.util.BufferedDataInput;
import org.persvr.util.CompareValues;
import org.persvr.util.SoftValueHashMap;
import org.persvr.util.WeakValueHashMap;

/**
 * The core implementation of the JavaScript object database source. 
 * 
 * @author Kris
 * 
 */

public class JavaScriptDB {
	/**
	 * 
	 * Notes on Databases Three files: transactions - This is where all the
	 * object changes are kept names - This is where property names are kept in
	 * a memory-mapped file (it's ok for this to have a 4GB limit) index - This
	 * is where indexes are kept. This file can be deleted and it will be
	 * auto-restored
	 * 
	 * index nodes have integrity by having a version number at the beginning
	 * and end of the node, if they don't match it is a corrupt node and needs
	 * to be rebuilt
	 * 
	 * All data changes are done as appends
	 * 
	 * Get a lock on the file to ensure only one process is accessing the
	 * database
	 * 
	 * two writing RAFs for the data, one that does the appending of history and
	 * new items in sync mode, the other that does index node updates and
	 * next-version-pointer updates. There can also be a large number of reading
	 * RAFs
	 * 
	 * write large number of 00000's ahead of history items to minimize the
	 * number of times the file must be lengthened
	 * 
	 * Memory-mapped byte buffers appears to be slower than RandomAccessFile
	 * considering that we can't memory map the entire DB file due to the 4GB
	 * limit of memory mapping It might possibly be worth looking to into memory
	 * mapping db files in 4GB segments but that could possibly go beyond OS
	 * application memory limits, at least in 32bit systems (maybe it would work
	 * in 64bit systems).
	 * 
	 */

	/**
	 * These both point to the same file, just with different sync settings
	 */
	Log log = LogFactory.getLog(JavaScriptDB.class);
	RandomAccessFile transactionLogFile;
	ThreadLocal<RandomAccessFile> transactionReadFile = new ThreadLocal<RandomAccessFile>();
	/**
	 * This the names file
	 */
	RandomAccessFile namesFile;
	RandomAccessFile statusFile;
	/**
	 * This is the index file, it is asynchronous
	 */
	ThreadLocal<RandomAccessFile> indexFile = new ThreadLocal<RandomAccessFile>();
	//TODO: do this as a WeakMap with mechanism for re-loading as necessary
	Map<Integer, String> internedStrings = new HashMap<Integer, String>();
	Map<String, Integer> stringsInterned = new HashMap<String, Integer>();
	Map<String, Integer> tableNameIds = new HashMap<String, Integer>();
	Map<Integer, Long> tableNextId = new HashMap<Integer, Long>();
	/**
	 * format: (byte)object-attributes (int)table-id (value)object-id
	 * (int)version-number (long)previous-version-pointer
	 * (long)previous-change-in-table property*
	 * 
	 * property: (int) property-name-id (byte)attributes value
	 * 
	 * value: header content
	 */
	public final static byte HEADER_INSTANCE = 1;
	public final static byte HEADER_OBJECT = 2;
	/**
	 * format: (byte)object-attributes (int)table-id (value)object-id
	 * (int)version-number (long)previous-version-pointer
	 * (long)previous-change-in-table array-slots*
	 * 
	 * array-slot: (byte)attributes value
	 */
	public final static byte HEADER_ARRAY = 3;
	/**
	 * (int)length string-utf-bytes
	 */
	public final static byte HEADER_STRING = 4;
	/**
	 * (int)integer
	 */
	public final static byte HEADER_INTEGER = 5;
	/**
	 * (long)long
	 */
	public final static byte HEADER_LONG = 6;
	public final static byte HEADER_BOOLEAN_FALSE = 14;
	public final static byte HEADER_BOOLEAN_TRUE = 15;
	/**
	 * (int)length string-representation-of-number
	 */
	public final static byte HEADER_DECIMAL = 7;
	/**
	 * This should only be used in property values format: (int)table-id entity
	 */
	public final static byte HEADER_REFERENCE = 8;
	public final static byte HEADER_REFERENCE_ARRAY = 28;

	/**
	 * This should only be used in index nodes and in history.changes arrays
	 * format: (long)raw-instance-pointer
	 */
	public final static byte HEADER_RAW_REFERENCE = 9;
	/**
	 * utf8-string
	 */
	public final static byte HEADER_FOREIGN_REFERENCE = 10;
	/**
	 * utf8-string
	 */
	public final static byte HEADER_FUNCTION = 11;
	/**
	 * (long)era-milli
	 */
	public final static byte HEADER_DATE = 12;
	public final static byte HEADER_UNDEFINED = 13;
	/**
	 * (long)length binary-data
	 */
	public final static byte HEADER_BINARY = 16;
	public final static byte HEADER_NULL = 17;
	public final static byte HEADER_BIG_STRING = 18;

	/**
	 * query(as a string value) last-history-id (long)root-node-reference
	 * 
	 * 
	 */
	public final static byte HEADER_INDEX = 19;
	/**
	 * (long)length (all descendants) entry*
	 * 
	 * entry: lower-bound-value entry-target
	 * 
	 * entry-target: (-raw-reference(long) | (byte)header
	 * (index-node-reference(long) | next-block))*
	 * 
	 * this disambiguated by seeing if the the long value is negative, if it is
	 * we treat it as a header which can be value (indicating a lower-bound
	 * value), or another index node
	 */
	public final static byte HEADER_INDEX_BRANCH = 20;
	public final static byte HEADER_INDEX_LEAF = 21;
	/**
	 * (long)length (of all non-indexed items for this value)
	 */
	public final static byte HEADER_UNINDEXED_DATA = 24;

	/**
	 * future value for an index-node that consists purely of object references
	 * (this is a possible performance optimization, so count operations don't
	 * need to look into each node
	 */
	public final static byte HEADER_UNIFORM_INDEX_NODE = 25;

	public final static byte HEADER_INDEX_REFERENCE_LONG = 26;
	public final static byte HEADER_INDEX_REFERENCE_INTEGER = 27;

	/**
	 * (int)table-id (int) length entries
	 */
	public final static byte HEADER_TABLE_INDEX = 21;

	/**
	 * (long)last-recorded-history-pointer (long)core-objects-pointer
	 * (long)first-history-pointer
	 */
	public final static byte HEADER_NO_MAX = 22;
	/**
	 * (int)length tables
	 */
	public final static byte HEADER_INDEX_ROOT = 23;
	public final static byte HEADER_END = (byte) 127;
	public final static byte OBJECT_ATTRIBUTE_IS_DELETED = 1;
	public final static byte OBJECT_ATTRIBUTE_IS_CURRENT = 32;
	public static final int PARENT_ATTRIBUTE_ID = 64;

	private final static Object END_OF_LIST = new Object();

	/**
	 * This is the central loading and parsing mechanism, the value of the
	 * current location in the database is returned
	 * 
	 * @return value from the database
	 */
	Object readEntity(boolean historic, boolean mustFinish) throws IOException {
		return readEntity(new BufferedDataInput(getTransactionsReadFile()), historic, mustFinish);
	}

	Object readEntity(BufferedDataInput input, boolean historic, boolean mustFinish) throws IOException {
		byte header = input.readByte();
		switch (header) {
		case HEADER_INSTANCE:
		case HEADER_OBJECT:
		case HEADER_ARRAY:
			long objectReference = input.getFilePointer() - 1;
			byte objectAttributes = input.readByte();
			int tableId = input.readInt();
			String table = internedStrings.get(tableId);
//			if (table == null) 
//				throw new IllegalStateException("Can not find table");
			Object objectId = readEntity(input, false, true);
			int versionNumber = (int) readVarLong(input);
			ObjectId id;
			if (table == null){
				// this means the table was deleted
				id = new NewObjectId(null);
			}
			else if (table.indexOf('.') > -1) {
				id = ObjectId.idForObject(header == HEADER_ARRAY ? arraySource : objectSource, tableId + "-" + objectId
						+ (historic ? "-v" + versionNumber : ""), true);
			} else {
				id = ObjectId.idForObject(DataSourceManager.getSource(table), historic ? objectId + "-v" + versionNumber : objectId.toString());
			} 
			if (id.isLoaded() && !mustFinish)
				return id.getTarget();
			long previousVersionReference = readVarLong(input);
			long lastTableChange = readVarLong(input);
			Date lastModified = (Date) readEntity(input, false, true);
			if("Transaction".equals(table))
				// transactions are always historic
				historic = true;
			synchronized (id) {
				PersistableInitializer initializer = DataSourceHelper.initializeObject(id);

				byte attributes;
				try {
					if (header == HEADER_ARRAY) {
						List<Object> list = new ArrayList<Object>();
						ObjectId parentId = null;
						while ((attributes = input.readByte()) != HEADER_END) {
							Object value = readEntity(input, historic, true);
							if(attributes == PARENT_ATTRIBUTE_ID){
								parentId = (ObjectId)value;
								
							}
							else{
								list.add(value instanceof Persistable ? ((Persistable) value).getId() : value);
							}
						}
						initializer.initializeList(list);
						if(parentId != null)
							initializer.setParent(parentId);
					} else {
						int propertyIndex;
						while ((attributes = input.readByte()) != HEADER_END) {
							if(attributes == PARENT_ATTRIBUTE_ID){
								Object value = readEntity(input, historic, true);
								initializer.setParent((ObjectId)value);
							}
							else{
								propertyIndex = input.readInt();
								Object value = readEntity(input, historic, true);
								String propertyName = internedStrings.get(propertyIndex);
								initializer.setProperty(propertyName, value instanceof Persistable ? ((Persistable) value).getId() : value, attributes);
								if(inRecoveryProcess){
									RootIndexNode index = getIndex(tableId, propertyName);
									if(index.lastUpdatedFromTable == -1){
										// we are recreating an index, it must be done from scratch, incremental won't do
										index.lastUpdatedFromTable = 0;
									}
								}
							}
						}
						if (attributes == -2) {
							// this indicates it was deleted
							throw new ObjectNotFoundException(id.source, objectId.toString());
						}
					}
					if(inRecoveryProcess){
						updateTableLastChange(tableId, objectReference, objectId instanceof Number ? ((Number)objectId).longValue() : 0);
					}
				} catch (RuntimeException e) {
					if (mustFinish || e instanceof ObjectNotFoundException)
						throw e;
					else
						log.error("Corrupt properties found on " + id);
				}
				initializer.setLastModified(lastModified);
				initializer.setVersion(new ObjectVersion(objectReference, previousVersionReference, lastTableChange, versionNumber,
						(objectAttributes & OBJECT_ATTRIBUTE_IS_CURRENT) == OBJECT_ATTRIBUTE_IS_CURRENT,
						(objectAttributes & OBJECT_ATTRIBUTE_IS_DELETED) == OBJECT_ATTRIBUTE_IS_DELETED));
				ScriptableObject loadedObject = (ScriptableObject) initializer.getInitializingObject();
				assert ((ObjectVersion) ((Persistable) loadedObject).getVersion()).currentVersionReference == objectReference;
				if (historic) {
					synchronized (referenceToVersions) {
						referenceToVersions.put(objectReference, (Persistable) loadedObject);
					}
					if(!(loadedObject instanceof PersistableArray)){
						//TODO: make the persistable array load everything up front so we don't have to do this
						loadedObject.sealObject();
					}
				} else
					synchronized (referenceToInstances) {
						referenceToInstances.put(objectReference, (Persistable) loadedObject);
					}
				return loadedObject;
			}
		case HEADER_STRING:
		case HEADER_DECIMAL:
			byte[] bytes = new byte[input.readInt()];
			input.readFully(bytes);
			//TODO: Use faster String encoding techniques here (using Charset.encode(), and directly using the ByteBuffer.array())
			String asString = new String(bytes, "UTF-8");
			if(header == HEADER_DECIMAL){
				if("NaN".equals(asString))
					return Double.NaN;
				if("Infinity".equals(asString))
					return Double.POSITIVE_INFINITY;
				if("-Infinity".equals(asString))
					return Double.NEGATIVE_INFINITY;
				return new BigDecimal(asString);
			}
			return asString;
		case HEADER_INTEGER:
			return input.readInt();
		case HEADER_LONG:
			return input.readLong();
		case HEADER_BOOLEAN_FALSE:
			return false;
		case HEADER_BOOLEAN_TRUE:
			return true;
		case HEADER_NULL:
			return null;
		case HEADER_DATE:
			return new Date(input.readLong());
		case HEADER_REFERENCE: case HEADER_REFERENCE_ARRAY:
			tableId = input.readInt();
			objectId = readEntity(input, historic, true);
			return convertIdToExternalId(tableId, objectId, header == HEADER_REFERENCE_ARRAY);		
		case HEADER_RAW_REFERENCE:
			long lastPointer = input.getFilePointer();
			long reference = input.readLong();
			input.seek(reference);
			Object value = readEntity(input, true, true);
			input.seek(lastPointer);
			return value;
		case HEADER_FOREIGN_REFERENCE:
			return Identification.idForString(input.readString());
		case HEADER_BINARY:
		case HEADER_BIG_STRING:
			long fileId = readVarLong(input);
			BinaryData.InputStreamSource inputSource = readFile(fileId);
			if (header == HEADER_BINARY)
				return new BinaryData(inputSource);
			return IOUtils.toString(inputSource.getStream(), "UTF-8");
		case HEADER_UNDEFINED:
			return Undefined.instance;
		case HEADER_END:
			return END_OF_LIST;
		case HEADER_NO_MAX:
			return NO_MAX;
		case HEADER_FUNCTION:
			return FunctionUtils.createFunction(input.readString(), "function");
		default:
			throw new RuntimeException("Unknown header found in database " + header);
		}
	}

	public Map<Integer, Long> tableLastChange = new HashMap<Integer, Long>();
	public Map<Integer, Long> tableLastChangeCommitted = new HashMap<Integer, Long>();
	public Map<Integer, Long> tableLastChangePointer = new HashMap<Integer, Long>();
	public final static byte NAMES_HEADER_PROPERTY_NAME = 0;
	public final static byte NAMES_HEADER_TABLE_NAME = 1;
	public final static byte NAMES_HEADER_SUB_TABLE_NAME = 2;
	public final static byte NAMES_HEADER_TABLE_NAME_ERASED = 3;
	String location;

	public JavaScriptDB(String location) throws IOException {
		this.location = location;
		File containingDir = new File(location);
		if (!containingDir.exists())
			containingDir.mkdirs();
		transactionLogFile = new RandomAccessFile(location + "/transactions.psv", "rw");
		namesFile = new RandomAccessFile(location + "/names.psv", "rw");
		if(namesFile.getChannel().tryLock() == null){
			throw new RuntimeException("The database is already in use");
		}
		statusFile = new RandomAccessFile(location + "/status.psv", "rw");
		if(statusFile.getChannel().tryLock() == null){
			throw new RuntimeException("The database is already in use");
		}
		readNames();
		getInternString("id");
		readStatus();
		loadIndexes();
	}
	boolean inRecoveryProcess;
	public void initialize() throws IOException {
		inRecoveryProcess = true;
		restartTransactions();
		// copy the updates
		tableLastChange.putAll(tableLastChangeCommitted);
		inRecoveryProcess = false;
	}

	void restartTransactions() throws IOException {
		Long lastTransaction = tableLastChange.get(getTableId("Transaction"));
		if (lastTransaction != null) {
			transactionLogFile.seek(lastTransaction > 0 ? lastTransaction : 0);
			try {
				// run through each history until an exception is thrown
				BufferedDataInput bdi = new BufferedDataInput(transactionLogFile);
				while (true) {
					//TODO: update the status file with table changes as we read them, including both the last reference and any higher IDs
					readEntity(bdi, true, true);
					lastTransaction = bdi.getFilePointer();
				}
			} catch (EOFException e) {
				//normal
			} catch (Throwable e) {
				log.debug("recovering database",e);
				// this should end in an exception
			}
			transactionLogFile.seek(lastTransaction > 0 ? lastTransaction : 0);
		}
	}

	RandomAccessFile getTransactionsReadFile() throws IOException {
		RandomAccessFile raf = transactionReadFile.get();
		if (raf == null) {
			transactionReadFile.set(raf = new RandomAccessFile(location + "/transactions.psv", "rw"));
		}
		return raf;
	}

	RandomAccessFile getIndexFile() throws IOException {
		RandomAccessFile raf = indexFile.get();
		if (raf == null) {
			indexFile.set(raf = new RandomAccessFile(location + "/index.psv", "rw"));
		}
		return raf;
	}

	void readNames() throws IOException {
		BufferedDataInput namesInput = new BufferedDataInput(namesFile);
		while (namesInput.getFilePointer() < namesInput.length()) {
			int pointer = (int) namesInput.getFilePointer();
			byte block = namesInput.readByte();
			String propName = namesInput.readString();
			switch (block) {
			case NAMES_HEADER_TABLE_NAME:
			case NAMES_HEADER_SUB_TABLE_NAME:
				tableNameIds.put(propName, pointer);
				internedStrings.put(pointer, propName);
				break;
			case NAMES_HEADER_PROPERTY_NAME:
				//tableNames.add(tableName);
				stringsInterned.put(propName, pointer);
				internedStrings.put(pointer, propName);
				break;
			case NAMES_HEADER_TABLE_NAME_ERASED:
				// deleted table
				internedStrings.put(pointer, propName);
				break;
			default:
				throw new IllegalStateException("Unknown name type");
			}
		}
	}

	boolean namesFileDirty = false;

	/**
	 * Get the id for a table, creating it if it doesn't exist
	 * 
	 * @param tableName
	 * @return
	 * @throws IOException
	 */
	Integer getTableId(String tableName) throws IOException {
		//TODO: if it is an Object or Array, parse the id part to determine the "real" internal table
		Integer tableId = tableNameIds.get(tableName);
		if (tableId == null) {
			synchronized (namesFile) {
				byte[] bytes = tableName.getBytes("UTF-8");
				tableId = (int) namesFile.length();
				namesFile.seek(tableId);
				namesFile.writeByte(tableName.indexOf('.') == -1 ? NAMES_HEADER_TABLE_NAME : NAMES_HEADER_SUB_TABLE_NAME);
				tableNameIds.put(tableName, tableId);
				internedStrings.put(tableId, tableName);
				namesFile.writeInt(bytes.length);
				namesFile.write(bytes);
				namesFile.getChannel().force(true);
			}
			initializeTableStatus(tableId);
		}
		return tableId;
	}
	void initializeTableStatus(Integer tableId) throws IOException{
		synchronized (tableLastChangePointer) {
			synchronized (tableLastChangeCommitted) {
				tableLastChange.put(tableId, (long) -1);
				tableLastChangeCommitted.put(tableId, (long) -1);
			}
			long pointer = statusFile.length();
			tableLastChangePointer.put(tableId, pointer + 4);
			statusFile.seek(pointer);
			statusFile.writeInt(tableId);
			statusFile.writeLong(-1); // reference to the highest point in the transaction for the table
			statusFile.writeLong(1); // the next id
		}
		
	}
	Object getObjectId(ObjectId id) {
		try {
			return Long.parseLong(id.subObjectId);
		} catch (NumberFormatException e) {
			//TODO: Need to parse the object id in the case of Array or Object, and return the internal id 
			return id.subObjectId;
		}
	}
	class InternalId {
		int tableId;
		Object subObjectId;
	}
	private ObjectId convertIdToExternalId(int tableId, Object objId, boolean array) {
		String table = internedStrings.get(tableId);
		int dotIndex = table.indexOf('.');
		if(dotIndex > -1){
			return ObjectId.idForObject(array ? arraySource : objectSource, tableId + "-" + objId, true);
		}
		return ObjectId.idForObject(DataSourceManager.getSource(table), objId.toString());
	}
	InternalId convertIdToInternalObject(ObjectId id) {
		String idAsString = id.subObjectId;
		InternalId internalId = new InternalId();
		internalId.tableId = tableNameIds.get(id.source.getId());
		if (idAsString.indexOf("-v") > -1) {
			idAsString = idAsString.substring(0, idAsString.indexOf("-v"));
		}
		try {
			int dashIndex = idAsString.indexOf("-") ;
			if(dashIndex > -1 && ("Array".equals(id.source.getId()) || "Object".equals(id.source.getId()))){
				internalId.tableId = Integer.parseInt(idAsString.substring(0,dashIndex));
				idAsString = idAsString.substring(dashIndex + 1);
			}
			internalId.subObjectId = Long.parseLong(idAsString);
		} catch (NumberFormatException e) {
			internalId.subObjectId = idAsString;
		}
		return internalId;
	}

	void updateTableLastChange(int tableId, long lastChange, long objectId) throws IOException {
		synchronized (tableLastChangePointer) {
			synchronized (tableLastChangeCommitted) {
				Long lastLastChange = tableLastChangeCommitted.get(tableId);
				if(lastLastChange == null || lastChange > lastLastChange)
					tableLastChangeCommitted.put(tableId, lastChange);
				else
					lastChange = lastLastChange;
			}
			long pointer = tableLastChangePointer.get(tableId);
			statusFile.seek(pointer);
			statusFile.writeLong(lastChange);
			Long nextId = tableNextId.get(tableId);
			if (nextId == null || nextId <= objectId) {
				nextId = objectId - (objectId % idIncrement) + idIncrement + idOffset;
				tableNextId.put(tableId, nextId);
				statusFile.writeLong(nextId);
			}
		}
		final String table = internedStrings.get(tableId);
	}

	void readStatus() throws IOException {
		while (statusFile.getFilePointer() < statusFile.length()) {
			int tableId = statusFile.readInt();
			long pointer = statusFile.getFilePointer();
			long lastChange = statusFile.readLong();
			tableLastChange.put(tableId, lastChange);
			tableLastChangeCommitted.put(tableId, lastChange);
			tableNextId.put(tableId, statusFile.readLong());
			tableLastChangePointer.put(tableId, pointer);
		}
		for(Integer tableId : tableNameIds.values()){
			if(!tableLastChange.containsKey(tableId))
				initializeTableStatus(tableId);
		}
	}

	int idIncrement = 1;
	int idOffset = 0;
	void setIdSeq(Integer tableId, long nextId) throws IOException {
		tableNextId.put(tableId, nextId);
		synchronized (tableLastChangePointer) {
			statusFile.seek(tableLastChangePointer.get(tableId) + 8);
			statusFile.writeLong(nextId);
		}
	}
	Long getNextId(Integer tableId, boolean increment) throws IOException {
		// TODO: Implement more granular locking to reduce contention
		synchronized (tableNextId) {
			Long nextId = tableNextId.get(tableId);
			if (nextId == null) {

				Long lastChange;
				synchronized (tableLastChange) {
					lastChange = tableLastChange.get(tableId);
				}
				if (lastChange == null)
					throw new RuntimeException("Unable to find table " + tableId + " in status file, needs to be recreated");
				tableNextId.put(tableId, (long) idOffset + 2 * idIncrement);
				nextId = (long) idOffset + idIncrement;
			}
			if(increment){
				tableNextId.put(tableId, nextId + idIncrement);
				synchronized (tableLastChangePointer) {
					statusFile.seek(tableLastChangePointer.get(tableId) + 8);
					statusFile.writeLong(nextId + idIncrement);
				}
			}

			return nextId;
		}
	}

	long nextFileId;
	Object fileIdLock = new Object();

	long getNextFileId() {
		synchronized (fileIdLock) {
			if (nextFileId == 0) {
				File startDirectory = new File(location + "/files");
				while (startDirectory != null && startDirectory.isDirectory()) {
					File[] files = startDirectory.listFiles();
					int highestName = -1;
					File highestFile = null;
					for (File file : files) {
						if (!file.getName().startsWith(".")) {
							int nameAsNum = Integer.parseInt(file.getName());
							if (nameAsNum > highestName) {
								highestFile = file;
								highestName = nameAsNum;
							}
						}
					}
					if (highestName > -1)
						nextFileId = (nextFileId << 12) + highestName;
					startDirectory = highestFile;
				}
				nextFileId++;
			}
			return nextFileId++;
		}
	}

	private String getFolderNameForId(long fileId) {
		return location + "/files/" + ((int) (fileId >>> 48) & 0xFFF) + "/" + ((int) (fileId >>> 36) & 0xFFF) + "/" + ((int) (fileId >>> 24) & 0xFFF)
				+ "/" + ((int) (fileId >>> 12) & 0xFFF);
	}

	BinaryData.InputStreamSource readFile(final long fileId) throws IOException {
		return new BinaryData.InputStreamSource() {
			public InputStream getStream() {
				try {
					return new FileInputStream(getFolderNameForId(fileId) + "/0" + ((int) (fileId >>> 0) & 0xFFF));
				} catch (FileNotFoundException e) {
					throw new RuntimeException(e);
				}
			}
		};
	}

	long writeFile(Object data) throws IOException {
		long fileId = getNextFileId();
		//TODO: Write this file outside of the syncrhonized commit section 
		String filename = getFolderNameForId(fileId);
		File dest = new File(filename);
		if (!dest.exists())
			dest.mkdirs();
		filename += "/0" + // the leading zero will be used to distinguish files
				((int) (fileId >>> 0) & 0xFFF);

		FileOutputStream fos = new FileOutputStream(filename);
		if (data instanceof String) {
			fos.write(((String) data).getBytes("UTF-8"));
		} else if (data instanceof BinaryData) {
			IOUtils.copy(((BinaryData) data).getStream(), fos);
			// we do this so we can gc the binary data, but read it back as necessary
			((BinaryData) data).setSource(readFile(fileId));
		}
		fos.close();
		return fileId;
	}

	void deleteTable(String tableName) throws IOException {
		Integer tableId = tableNameIds.get(tableName);
		synchronized (namesFile) {
			tableNameIds.remove(tableName);
			namesFile.seek(tableId);
			namesFile.writeByte(NAMES_HEADER_TABLE_NAME_ERASED);
			// we should always be at the end
			namesFile.seek(namesFile.length());
		}
	}

	enum WriteState {
		HISTORY, FROZEN_VERSION, CHANGED, REFERENCE_IF_EXISTS
		//TODO: create one for writing index references (where strings are referenced is they are very long)
	}
	ArrayList<String> recentlyAddedInterns = new ArrayList();

	int getInternString(String string) throws IOException {
		Integer pointer = stringsInterned.get(string);
		if (pointer == null) {
			// if we don't have it, then we will create one, but we need to get a lock make sure it hasn't changed first
			synchronized (namesFile) {
				pointer = stringsInterned.get(string);
				if (pointer == null) {
					pointer = (int) namesFile.getFilePointer();
					stringsInterned.put(string, pointer);
					internedStrings.put(pointer, string);
					byte[] bytes = string.getBytes("UTF-8");
					namesFile.writeByte(0);
					namesFile.writeInt(bytes.length);
					namesFile.write(bytes);
					namesFileDirty = true;
					recentlyAddedInterns.add(string);
				}
			}
		}
		return pointer;
	}

	/**
	 * This is holds the set of object that have been overwritten during a
	 * particular timeframe (used by bringUpToDate)
	 * 
	 * @author Kris
	 * 
	 */
	class WriteListener {
		Set<Long> overWrittenObjects = new HashSet<Long>();

		void addOverWrittenObject(Long overwrittenObjectReference) {
			synchronized (overWrittenObjects) {
				overWrittenObjects.add(overwrittenObjectReference);
			}
		}

		boolean containsOverWrittenObject(Long objectReference) {
			synchronized (overWrittenObjects) {
				return overWrittenObjects.contains(objectReference);
			}
		}
	}

	Set<WriteListener> writeListeners = new HashSet<WriteListener>();
	private static Object parseIfPossible(String id){
		try {
			return Long.parseLong(id);
		}catch(NumberFormatException e){
			return id;
		}
	}
	//FileOutputStream fos = new FileOutputStream("C:\\temp\\test.log");
	void writeObject(final Persistable object, DataOutput raf, WriteState state, final String defaultTableName, final ObjectId parentId) throws IOException {
		ObjectId objId = object.getId();
		String tableName = objId.source == null ? defaultTableName : objId.source.getId();
		String subObjectId = objId.subObjectId;
		int splitPoint = subObjectId.indexOf('-');
		final Integer tableId;
		if(splitPoint > -1 && ("Array".equals(tableName) || "Object".equals(tableName))){
			if(subObjectId.indexOf('v') > -1){
				throw new RuntimeException("Can not modify a history object");
			}
			tableId = Integer.parseInt(subObjectId.substring(0,splitPoint));
			subObjectId = subObjectId.substring(splitPoint + 1);
		}
		else
			tableId = getTableId(tableName);
		final Object id = objId.source == null ? getNextId(tableId, true) : parseIfPossible(subObjectId);
		if (objId.source == null)
			objId.persistIfNeeded(new StartAsEmptyPersister() {

				public String getObjectId() {
					//				if(id > -1)
					return tableId + "-" + id;
					/*
					 * DataSource source = ((ObjectId)value).source; if(source
					 * instanceof InternalObjectSource){ return Long.toString(id =
					 * ((InternalObjectSource)source).getNextId()); }
					 */
				}

				public DataSource getSource() {
					return object instanceof List ? arraySource : objectSource;
				}

				@Override
				public ObjectId getParent() {
					return parentId;
				}

				@Override
				public void initializeAsList(List<? extends Object> values) throws Exception {
				}

				@Override
				public void recordProperty(String name, Object value) throws Exception {
				}

				public boolean isHiddenId() {
					return true;
				}

			});

		final long objectReference = transactionBuffer.getFilePointer();
		//System.err.println("writing object at " + objectReference);
		raf.writeByte(object instanceof List ? HEADER_ARRAY : HEADER_INSTANCE);
		boolean deleteIt = Boolean.TRUE.equals(currentChangedObjects.get(object));
		raf.writeByte(deleteIt ? OBJECT_ATTRIBUTE_IS_CURRENT | OBJECT_ATTRIBUTE_IS_DELETED
				: OBJECT_ATTRIBUTE_IS_CURRENT);
		raf.writeInt(tableId);
		writeEntity(id, raf, null);
		ObjectVersion version = (ObjectVersion) object.getVersion();
		//fos.write(("new object " + tableId + " " + id + " version " + (version == null ? null : version.versionNumber + 1) + " ref " + objectReference + '\n').getBytes());
		if (version == null) {
			version = new ObjectVersion(-1, -1, -1, 0, false, false);
		}
		assert tableLastChange.get(tableId) != objectReference;
		ObjectVersion newVersion = new ObjectVersion(objectReference, version.currentVersionReference, tableLastChange.get(tableId),
				version.versionNumber + 1, true, deleteIt);
		/*ObjectId historyId = ObjectId.idForObject(objId.source, objId.subObjectId + "-v" + newVersion.versionNumber);
		PersistableInitializer historyInitializer = DataSourceHelper.initializeObject(historyId);
		if (object instanceof List) {

		} else {
			for (Map.Entry entry : object.entrySet(PersistableObject.ENTRY_SET_INCLUDE_DONT_ENUM)) {
				historyInitializer.setProperty(entry.getKey().toString(), entry.getValue(), 0);
			}
			historyInitializer.setLastModified(transactionTime);
			historyInitializer.setVersion(newVersion);
		}
		historyInitializer.finished();
		synchronized (referenceToVersions) {
			referenceToVersions.put(objectReference, historyInitializer.getInitializingObject());
		}*/
		assert version.currentVersionReference != objectReference : "objectReference equals previous reference";
		synchronized (writeListeners) {
			for (WriteListener listener : writeListeners) {
				listener.addOverWrittenObject(version.currentVersionReference);
			}
		}
		version.isCurrent = false;
		writeVarLong(raf, newVersion.versionNumber);
		assert objectReference > newVersion.previousVersionReference;
		writeVarLong(raf, newVersion.previousVersionReference);
//		if(newVersion.previousTableChange == -1)
	//		System.err.println("starting new table " + tableId);
		writeVarLong(raf, newVersion.previousTableChange);
		PersistableObject.setVersion(object, newVersion);
		writeEntity(transactionTime, raf, null);
		boolean idNeedsToCatchup = false;
		if (object instanceof List) {
			WriteState nextState = state == WriteState.FROZEN_VERSION ? WriteState.CHANGED : WriteState.REFERENCE_IF_EXISTS;
			for (Object item : (List) object) {
				raf.writeByte(0); // attribute
				if (item instanceof Persistable && ((((Persistable) item).getId().source == null && !(((Persistable) item).getId() instanceof AliasIds.AliasHandler)) || ((Persistable) item).getParent() == object))
					writeObject((Persistable) item, raf, nextState, tableName + ".*", state == WriteState.CHANGED || state == WriteState.REFERENCE_IF_EXISTS ? objId : null);
				else
					writeEntity(item, raf, nextState);
			}
			if(!(parentId instanceof Query || (parentId instanceof ObjectId && ((ObjectId)parentId).subObjectId == null))){
				raf.writeByte(PARENT_ATTRIBUTE_ID); // attribute
				writeEntity(parentId, raf, WriteState.REFERENCE_IF_EXISTS);
			}

			raf.writeByte(HEADER_END);
			final RootIndexNode index = getIndex(tableId, "id");
			//System.err.println(tableId + "index.lastUpdatedFromTable == newVersion.previousTableChange" + index.lastUpdatedFromTable + " == " + newVersion.previousTableChange + " next " + objectReference);
			if((index.lastUpdatedFromTable == -1 || index.lastUpdatedFromTable == newVersion.previousTableChange) &&
					index.updatesSinceLastQuery < MAX_AUTO_INDEXED_UPDATES_BETWEEN_QUERIES){
				// update the id index
				if(newVersion.previousVersionReference != -1){
					final IndexNodeUpdate update = new IndexNodeUpdate(id, false, newVersion.previousVersionReference, index);
					onCommitTasks.add(new Runnable(){
						public void run() {
							try {
								index.submitIfNeeded(index.addToObjectsNeedingIndex(update));
							} catch (IOException e) {
								throw new RuntimeException(e);
							}				
						}
					});

					
				}
				if(!deleteIt){
					final IndexNodeUpdate update = new IndexNodeUpdate(id, true, objectReference, index);
					onCommitTasks.add(new Runnable(){
						public void run() {
							try {
								index.submitIfNeeded(index.addToObjectsNeedingIndex(update));
							} catch (IOException e) {
								throw new RuntimeException(e);
							}				
						}
					});
					
//					index.updatesSinceLastQuery=0;							
				}
				index.lastUpdatedFromTable = objectReference;
			}
			else {
				log.warn("id index will be brought up to date...");
				idNeedsToCatchup = true;
			}
		} else {
			Set<Map.Entry<String, Object>> entries = ((Persistable) object).entrySet(PersistableObject.ENTRY_SET_INCLUDE_DONT_ENUM);
			Object[] priorVersionValues = new Object[entries.size()];
			int i = 0;
			for (Map.Entry<String, Object> property : entries) {
				priorVersionValues[i++] = property.getValue();
			}
			WriteState nextState = state == WriteState.HISTORY ? WriteState.FROZEN_VERSION : WriteState.REFERENCE_IF_EXISTS;
			i= 0;
			Map<Integer, Long> propertyToIndexMap = queryToIndex.get(tableId);
			if(propertyToIndexMap == null)
				queryToIndex.put(tableId, propertyToIndexMap = new HashMap());
			for (Map.Entry<String, Object> property : entries) {
				raf.writeByte(0); // attribute
				int propertyId = getInternString(property.getKey());
				if(!propertyToIndexMap.containsKey(propertyId))
					getIndex(tableId, property.getKey());
				raf.writeInt(propertyId);
				Object value = property.getValue();				
				if (value instanceof Persistable && (((Persistable) value).getId().source == null || ((Persistable) value).getParent() == object))
					writeObject((Persistable) value, raf, nextState, tableName + '.' + property.getKey(), state == WriteState.CHANGED  || state == WriteState.REFERENCE_IF_EXISTS ? objId : null);
				else if(value != Scriptable.NOT_FOUND)
					writeEntity(value, raf, nextState);
			}
			if(!(parentId instanceof Query || (parentId instanceof ObjectId && ((ObjectId)parentId).subObjectId == null))){
				raf.writeByte(PARENT_ATTRIBUTE_ID); // attribute
				writeEntity(parentId, raf, WriteState.REFERENCE_IF_EXISTS);
			}

			raf.writeByte(HEADER_END);
			if(!propertyToIndexMap.containsKey(getInternString("id"))){
				getIndex(tableId, "id");
			}
			assert propertyToIndexMap.containsKey(getInternString("id"));
			// submit for indexing
			Object properties = object.getSchema().get("properties");			
			if(newVersion.previousVersionReference != -1){
				Transaction.suspendTransaction();
				for(Map.Entry<Integer, Long> propertyToIndex : propertyToIndexMap.entrySet()){
					String propertyName = internedStrings.get(propertyToIndex.getKey());

					if(!(properties instanceof Persistable && ((Persistable)properties).get(propertyName) instanceof Persistable && 
							Boolean.FALSE.equals(((Persistable)((Persistable)properties).get(propertyName)).get("index")))){
						Object priorValue = propertyName.equals("id") ? id : object.get(internedStrings.get(propertyToIndex.getKey()));
						final RootIndexNode index = getIndex(tableId, propertyName);
						
						if((index.lastUpdatedFromTable == -1 || index.lastUpdatedFromTable == newVersion.previousTableChange) &&
								index.updatesSinceLastQuery < MAX_AUTO_INDEXED_UPDATES_BETWEEN_QUERIES && 
								priorValue != Scriptable.NOT_FOUND){
							final IndexNodeUpdate update = new IndexNodeUpdate(priorValue, false, newVersion.previousVersionReference, index);
							onCommitTasks.add(new Runnable(){
								public void run() {
									try {
										index.submitIfNeeded(index.addToObjectsNeedingIndex(update));
									} catch (IOException e) {
										throw new RuntimeException(e);
									}				
								}
							});
							
							
						}
					}
				}
				transactionBeingWritten.enterTransaction();
			}
			for(Map.Entry<Integer, Long> propertyToIndex : propertyToIndexMap.entrySet()){
				String propertyName = internedStrings.get(propertyToIndex.getKey());
				Object forceIndex = null;
				if(!(properties instanceof Persistable && ((Persistable)properties).get(propertyName) instanceof Persistable && 
						Boolean.FALSE.equals(forceIndex = ((Persistable)((Persistable)properties).get(propertyName)).get("index")))){
					Object value = propertyName.equals("id") ? id : object.get(internedStrings.get(propertyToIndex.getKey()));					
					final RootIndexNode index = getIndex(tableId, propertyName);
					if((index.lastUpdatedFromTable == -1 || index.lastUpdatedFromTable == newVersion.previousTableChange) &&
							index.updatesSinceLastQuery < MAX_AUTO_INDEXED_UPDATES_BETWEEN_QUERIES){
						if(!deleteIt && value != Scriptable.NOT_FOUND){
							if(!Boolean.TRUE.equals(forceIndex) && !"id".equals(propertyName))
								index.updatesSinceLastQuery++;
							final IndexNodeUpdate update = new IndexNodeUpdate(value, true, objectReference, index);
							onCommitTasks.add(new Runnable(){
								public void run() {
									try {
										index.submitIfNeeded(index.addToObjectsNeedingIndex(update));
									} catch (IOException e) {
										throw new RuntimeException(e);
									}				
								}
							});
						}
						else{
							// dummy submission to make sure the lastUpdatedFromTable gets written to disk 
							onCommitTasks.add(new Runnable(){
								public void run() {
									try {
										index.submitIfNeeded(index.addToObjectsNeedingIndex(NOP_UPDATE));
									} catch (IOException e) {
										throw new RuntimeException(e);
									}				
								}
							});
						}
						index.lastUpdatedFromTable = objectReference;
					}
					else if(propertyName.equals("id")) {
						log.warn("id index will be brought up to date...");
						idNeedsToCatchup = true;
					}
				}
			}

		}
		synchronized (referenceToInstances) {
			referenceToInstances.remove(newVersion.previousVersionReference);
			referenceToInstances.put(objectReference, object);
		}
		final boolean runIndex = idNeedsToCatchup;
		tableLastChange.put(tableId, objectReference);
		onCommitTasks.add(new Runnable(){
			public void run() {
				try {
					updateTableLastChange(tableId, objectReference, 0);
					if (runIndex) {
						getIndex(tableId, "id").bringUpToDate();
						log.warn("finished bringing id index up to date");
					}
				} catch (IOException e) {
					throw new RuntimeException(e);
				}				
			}
		});
		
		//System.err.println("finished writing object at " + objectReference);
	}

	/**
	 * The primary mechanism for serializing data to the database
	 * 
	 * @param value
	 */
	void writeEntity(Object value, DataOutput raf, WriteState state) throws IOException {
		if (value instanceof ObjectId || value instanceof Persistable) {
			ObjectId objId;
			if (value instanceof Persistable)
				objId = ((Persistable) value).getId();
			else
				objId = (ObjectId) value;
			String sourceName = objId.source == null ? null : objId.source.getId();
			Integer tableId = tableNameIds.get(sourceName);
			if (tableId == null) {
				raf.writeByte(HEADER_FOREIGN_REFERENCE);
				writeString(raf, objId.toString());
			} else {
				if (objId.source == arraySource) {
					switch (state) {
					case HISTORY:
						throw new IllegalStateException("Transaction instance can't be an array");
					case FROZEN_VERSION:
					case CHANGED:
						Persistable object = value instanceof Persistable ? (Persistable) value : objId.getTarget();
						writeObject(object, raf, state, null, null);
						break;
					case REFERENCE_IF_EXISTS:
						if (objId.isPersisted()) {
							raf.writeByte(HEADER_REFERENCE_ARRAY);
							InternalId internalId = convertIdToInternalObject(objId);
							raf.writeInt(internalId.tableId);
							writeEntity(internalId.subObjectId, raf, null);
						} else {
							throw new IllegalStateException();
						}

					}

				} else {
					switch (state) {
					case FROZEN_VERSION:
					case CHANGED:
					case HISTORY:
						Persistable object = value instanceof Persistable ? (Persistable) value : objId.getTarget();
						writeObject(object, raf, state, null, null);
						break;
					case REFERENCE_IF_EXISTS:
						if (objId.isPersisted()) {
							raf.writeByte(HEADER_REFERENCE);
							InternalId internalId = convertIdToInternalObject(objId);
							raf.writeInt(internalId.tableId);
							writeEntity(internalId.subObjectId, raf, null);
						} else {
							raf.writeByte(HEADER_INSTANCE);
							throw new IllegalStateException();
						}

					}
				}
			}
		} else if (value instanceof String) {
			if (((String) value).length() > STRING_EMBEDDED_SIZE_THRESHOLD) {
				raf.writeByte(HEADER_BIG_STRING);
				writeVarLong(raf, writeFile(value));
			} else {
				raf.writeByte(HEADER_STRING);
				writeString(raf, (String) value);
			}
		} else if (value instanceof Integer) {
			raf.writeByte(HEADER_INTEGER);
			raf.writeInt((Integer) value);
		} else if (value == null) {
			raf.writeByte(HEADER_NULL);
		} else if (value instanceof Boolean) {
			raf.writeByte(Boolean.TRUE.equals(value) ? HEADER_BOOLEAN_TRUE : HEADER_BOOLEAN_FALSE);
		} else if (value instanceof BinaryData) {
			raf.writeByte(HEADER_BINARY);
			writeVarLong(raf, writeFile(value));
		} else if (value instanceof Long) {
			if ((Long) value < Integer.MAX_VALUE && (Long) value > Integer.MIN_VALUE) {
				raf.writeByte(HEADER_INTEGER);
				raf.writeInt(((Long) value).intValue());
			} else {
				raf.writeByte(HEADER_LONG);
				raf.writeLong((Long) value);
			}
		} else if (value instanceof Number) {
			raf.writeByte(HEADER_DECIMAL);
			byte[] bytes = (value instanceof Double ? 
					ScriptRuntime.toString(((Double)value).doubleValue()) : 
						value.toString()).getBytes();
			raf.writeInt(bytes.length);
			raf.write(bytes);
		} else if (value instanceof Date) {
			raf.writeByte(HEADER_DATE);
			raf.writeLong(((Date) value).getTime());
		} else if (value == Undefined.instance || value == Scriptable.NOT_FOUND) {
			raf.writeByte(HEADER_UNDEFINED);
		} else if (value == NO_MAX) {
			raf.writeByte(HEADER_NO_MAX);
		} else if (value instanceof Function) {
			raf.writeByte(HEADER_FUNCTION);
			writeString(raf, (String) ((Function) value).toString());
		} else if (value instanceof Scriptable && "Date".equals(((Scriptable)value).getClassName())) {
			// it is a date
			Double time = (Double) ((Function) ScriptableObject.getProperty((Scriptable)value,"getTime")).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), (Scriptable)value, new Object[]{});
			raf.writeByte(HEADER_DATE);
			raf.writeLong(time.longValue());
		} else {
			raf.writeByte(HEADER_NULL);
			log.error("Unknown data type " + value.getClass() + " can not be persisted ");
		}
	}

	/**
	 * Reads a number which can be stored in variable format for optimum
	 * efficiency, returning a long
	 * 
	 * @param input
	 * @return
	 * @throws IOException
	 */
	static long readVarLong(DataInput input) throws IOException {
		byte header = input.readByte();
		switch (header) {
		case HEADER_INTEGER:
		case HEADER_INDEX_REFERENCE_INTEGER:
			return input.readInt();
		case HEADER_LONG:
		case HEADER_INDEX_REFERENCE_LONG:
			return input.readLong();
		}
		throw new RuntimeException("Expected number and a number type was not found in the DB");
	}

	/**
	 * Writes a number using optimum storage efficiency
	 * 
	 * @param raf
	 * @param value
	 * @throws IOException
	 */
	static void writeVarLong(DataOutput raf, long value) throws IOException {
		if (value < Integer.MAX_VALUE && value > Integer.MIN_VALUE) {
			raf.writeByte(HEADER_INTEGER);
			raf.writeInt((int) value);
		} else {
			raf.writeByte(HEADER_LONG);
			raf.writeLong(value);
		}
		//TODO: might as well as add byte and short in here
	}


	void writeString(DataOutput output, String str) throws IOException {
		byte[] bytes = str.getBytes("UTF-8");
		output.writeInt(bytes.length);
		output.write(bytes);
	}

	/*
	 * BigDecimal readDecimal(){ return new BigDecimal(readString()); }
	 * BinaryData readBinary(){ throw new UnsupportedOperationException(); }
	 */
	public static final int STRING_EMBEDDED_SIZE_THRESHOLD = 8000;
	/** This is the number of items in a table before building an index */
	public static final int BUILD_INDEX_THRESHOLD = 100;
	public static final int INDEX_NODE_SIZE = 8192;
	public static final int MAX_AUTO_INDEXED_UPDATES_BETWEEN_QUERIES = 2000;
	Map<Long, Object> referenceToInstances = DataSourceManager.softReferences ? new SoftValueHashMap<Long, Object>(100) : new WeakValueHashMap<Long, Object>(100);

	Object getInstanceByReference(long reference) throws IOException {
		Object instance;
		synchronized (referenceToInstances) {
			instance = referenceToInstances.get(reference);
		}
		if (instance == null) {
			getTransactionsReadFile().seek(reference);
			// referenceToInstances.put is done in the read
			instance = readEntity(false, false);
		}
		return instance;
	}

	Map<Long, Persistable> referenceToVersions = new WeakValueHashMap<Long, Persistable>(100);

	Persistable getVersionByReference(long reference) throws IOException {
		Persistable version;
		synchronized (referenceToVersions) {
			version = referenceToVersions.get(reference);
		}
		if (version == null) {
			getTransactionsReadFile().seek(reference);
			version = (Persistable) readEntity(true, false);
		}
		return version;
	}
	// TODO: may want to remove all this, and just do queries through indexes like all other traversals
	Map<Integer, Map<Integer, Long>> queryToIndex = new HashMap<Integer, Map<Integer, Long>>();
	Map<Long, RootIndexNode> queryToIndexNode = new HashMap<Long, RootIndexNode>();
	RootIndexIndex indexIndex;
	RootIndexNode historyIdIndex;

	/**
	 * When the database first starts, load up all the indexes
	 * 
	 * @throws IOException
	 */
	void loadIndexes() throws IOException {
		if (getIndexFile().length() == 0)
			indexIndex = new RootIndexIndex();
		else
			indexIndex = new RootIndexIndex(0); // the root index node is just zero, so we don't have to set anything
		// load the root index, which is the index into all the other indexes
		IndexTraverser traverser = new IndexTraverser(indexIndex);
		long indexReference;
		// TODO: remove this and load indexes on-demand
		while ((indexReference = traverser.nextReference(1)) != -1) {
			long indexId = traverser.minKey instanceof Long ? (Long) traverser.minKey : ((Number) traverser.minKey).longValue();
			int tableId = (int) (indexId >> 32);
			int propertyId = (int) ((indexId << 32) >> 32);
			
			if(queryToIndex.get(tableId) == null)
				queryToIndex.put(tableId, new HashMap<Integer, Long>());
			queryToIndex.get(tableId).put(propertyId, indexReference);
		}
		historyIdIndex = getIndex("Transaction", "id");
	}

	RootIndexNode getIndex(String table, String propertyName) throws IOException {
		Integer tableId = tableNameIds.get(table);
		return getIndex(tableId, propertyName);
	}
	RootIndexNode getIndex(Integer tableId, String propertyName) throws IOException {
		//TODO: Needs to be synchronized properly
		// TODO: eventually allow it to load indexes if they have been GC'ed (make queryToIndex a WeakHashMap)
		Integer propertyId = stringsInterned.get(propertyName);
		if (propertyId == null || tableId == null)
			return null;
		long indexId = ((long) tableId << 32) + propertyId;
		Long reference = null;
		synchronized (queryToIndex) {
			Map<Integer, Long> propertyMap = queryToIndex.get(tableId);
			if(propertyMap != null)
				reference = propertyMap.get(propertyId);
			if (reference == null) {
				return createIndex(tableId, propertyId);
			}
		}
		synchronized (queryToIndexNode) {
			RootIndexNode index = queryToIndexNode.get(indexId);
			if (index == null) {
				index = new RootIndexNode(reference);
				queryToIndexNode.put(indexId, index);
			}
			index.table = tableId;
			index.propertyName = propertyName;
			return index;
		}
	}

	static class TransactionalObjectReference extends IndexEntry {
		public TransactionalObjectReference(Object upperBound, long reference) {
			super(upperBound, reference);
		}

		Transaction transaction;
		boolean added;

		boolean skip() {
			//TODO: determine if the entry should be skipped or not
			return false;//added != transactionIsCurrent(transaction);
		}
	}

	/**
	 * Creates a new index for the given table.query
	 * 
	 * @param tableQuery
	 * @return
	 * @throws IOException
	 */
	RootIndexNode createIndex(int tableId, int propertyId) throws IOException {
		synchronized (indexFile) { // lock, so we can add to the file
			RootIndexNode index = new RootIndexNode();
			long indexId = ((long) tableId << 32) + propertyId;
			if(queryToIndex.get(tableId) == null){
				queryToIndex.put(tableId, new HashMap<Integer,Long>());
			}
			queryToIndex.get(tableId).put(propertyId, index.reference);
			queryToIndexNode.put(indexId, index);
			index.table = tableId;
			index.propertyName = internedStrings.get(propertyId);
			indexIndex.submitIfNeeded(indexIndex.addToObjectsNeedingIndex(new IndexNodeUpdate(indexId, true, index.reference, null)));
			return index;
		}
	}

	class ObjectVersion implements Version {
		long previousTableChange;
		long previousVersionReference;
		long currentVersionReference;
		int versionNumber;
		boolean isCurrent;
		boolean isDeleted;
		
		public ObjectVersion(long currentVersionReference, long previousVersionReference, long previousTableChange, int versionNumber,
				boolean isCurrent, boolean isDeleted) {
			super();
			this.previousVersionReference = previousVersionReference;
			this.previousTableChange = previousTableChange;
			this.currentVersionReference = currentVersionReference;
			this.versionNumber = versionNumber;
			this.isCurrent = isCurrent;
			this.isDeleted = isDeleted;
		}

		public Persistable getPreviousVersion() {
			if (previousVersionReference == -1)
				return null;
			try {
				Persistable previous = getVersionByReference(previousVersionReference);
				ObjectVersion previousVersion = (ObjectVersion) previous.getVersion();
				if (previousVersion.isCurrent) {
					previousVersion.isCurrent = false;
					RandomAccessFile transactionsFile = getTransactionsReadFile();
					transactionsFile.seek(previousVersionReference + 1);
					transactionsFile.writeByte(0); // set it to be a non-current version
				}
				return previous;
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		public int getVersionNumber() {
			return versionNumber;
		}

		public boolean isCurrent() {
			return isCurrent;
		}
		
	}

	/**
	 * This is the root index of all indexes, providing lookup of the root index
	 * node for each table/property combo as well as the history index node
	 * 
	 * @author Kris
	 * 
	 */
	class RootIndexIndex extends IndexNode {

		public RootIndexIndex() throws IOException {
			super(null);
		}

		public RootIndexIndex(long reference) throws IOException {
			super(reference);
		}
		public RootIndexNode getRoot(){
			return null;
		}
	}

	/**
	 * The root index node is a special in that it tracks when it was last
	 * updated and the table/property it is indexing
	 * 
	 * @author Kris
	 * 
	 */
	class RootIndexNode extends IndexNode {
		public RootIndexNode() throws IOException {
			super(null);
			lastUpdatedFromTable = -1;
			lastCommittedUpdateFromTable = -1;
			southLastCommittedUpdateFromTable = northLastCommittedUpdateFromTable = -1;
		}
		boolean north;
		public RootIndexNode(long reference) throws IOException {
			super(reference);
		}
		public RootIndexNode getRoot() {
			return this;
		}

		int table;
		String propertyName;
		// this indicates the last point in the commit history since this index was updated
		long lastUpdatedFromTable;
		long lastCommittedUpdateFromTable;
		long northLastCommittedUpdateFromTable;
		long southLastCommittedUpdateFromTable;
		Object updateCountLock = new Object();
		int northWaiting;
		int southWaiting;
		int updatesSinceLastQuery;
		// this keeps track of how what updates we have included from each transaction (so we don't need to rescan transactions and put every change in
		Map<Transaction, Long> lastUpdatedFromTransaction = new WeakHashMap<Transaction, Long>();

		void readHeader(DataInput input) throws IOException {
			southLastCommittedUpdateFromTable = northLastCommittedUpdateFromTable = lastCommittedUpdateFromTable = lastUpdatedFromTable = readVarLong(input);
			super.readHeader(input);
		}

		void writeHeader(DataOutput output) throws IOException {
			writeVarLong(output, lastCommittedUpdateFromTable);
			super.writeHeader(output);
		}

		@Override
		protected void finalize() throws Throwable {
			// if we can write it on shutdown, it will save some time on start up, not necessary though
		}
		public static final int MAX_TO_INDEX_AT_ONCE = 3000;

		/**
		 * This ensure that all the latest changes have been added to the Index
		 */
		void bringUpToDate() throws IOException {
			// we will need to have a "histories.affectedTableQuery" index to look into
			// to find relevant changes
			// we are synchronized against this object so we don't block the worker service 
			// from updating nodes
			long startTime = 0;
			if(Method.profiling)
				startTime = Method.startTiming();

			updatesSinceLastQuery = 0;
			synchronized (lastUpdatedFromTransaction) {
				long processingTableUpdate;
				WriteListener writeListener = new WriteListener();
				synchronized (writeListeners) {
					synchronized (tableLastChangeCommitted) {
						processingTableUpdate = tableLastChangeCommitted.get(table);
					}
					writeListeners.add(writeListener);
				}
				long startingLastChange = processingTableUpdate;
				//lastUpdatedFromTransaction
				// updating from transactions doesn't need to be synchronized
				//addToObjectsNeedingIndex(new IndexNodeUpdate(lastChangeObject.get(propertyName), true, lastChange));
				int numIndexed = 0;
				//We want to synchronize on another object that belongs to the RootIndexNode, so that the sub-bringUpToDate tasks can be working in the background
				try {
					while (processingTableUpdate > lastUpdatedFromTable) {
						//TODO: this iterates in reverse, so need to find someway to do partial indexes
						//if(numIndexed++ > MAX_TO_INDEX_AT_ONCE && !"id".equals(propertyName))
						//throw new QueryCantBeHandled("Too many items to index at once");
						Persistable lastChangeObject = getVersionByReference(processingTableUpdate);
						Persistable previousObject = lastChangeObject;
						ObjectVersion versionInfo = (ObjectVersion) lastChangeObject.getVersion();
						boolean isDeleted = versionInfo.isDeleted;
						// versionInfo.previousTableChange != processingTableUpdate: "previous  version points to self";
						if (versionInfo.currentVersionReference != processingTableUpdate || versionInfo.previousTableChange >= processingTableUpdate) {
							getVersionByReference(processingTableUpdate);
							throw new IllegalStateException("should not be here");
						}
						long nextTableUpdate = versionInfo.previousTableChange;
						if (versionInfo.isCurrent || writeListener.containsOverWrittenObject(processingTableUpdate)) {
							//System.err.println("bringUpToDate " + lastChangeObject.getId() + " isDelete " + isDeleted + " processing " + processingTableUpdate);
							boolean searching = true;
							do {
								versionInfo = (ObjectVersion) previousObject.getVersion();
								if (versionInfo.previousVersionReference <= lastUpdatedFromTable)
									searching = false;
								previousObject = versionInfo.getPreviousVersion();
								//System.err.println("bringUpToDate " + lastChangeObject.getId() + " isDelete " + isDeleted + " processing " + processingTableUpdate + " previous " + previousObject);
								// TODO: If we know a point at which the index has definitely not been updated, we don't need to do this removal if versionInfo.previousVersionReference > knownNotHaveBeenIndexed 
								if (previousObject != null) {
									submitIfNeeded(addToObjectsNeedingIndex(new IndexNodeUpdate("id".equals(propertyName) ? convertIdToInternalObject(previousObject
											.getId()).subObjectId : previousObject.get(propertyName), false, versionInfo.previousVersionReference, this)));
								}
							} while (searching);
							//System.err.println("numIndexed " + (numIndexed++));
							//System.out.println("addin to index " + processingTableUpdate + " " + nextTableUpdate + " " + (this instanceof RootIndexNode ? ((RootIndexNode)this).propertyName : ""));
							if(!isDeleted){
								Object value = "id".equals(propertyName) ? convertIdToInternalObject(lastChangeObject
										.getId()).subObjectId : lastChangeObject.get(propertyName);
								if(value != Scriptable.NOT_FOUND)
									submitIfNeeded(addToObjectsNeedingIndex(new IndexNodeUpdate(value, true, processingTableUpdate, this)));
							}
						}
						processingTableUpdate = nextTableUpdate;
					}
				}

				finally {
					//if(lastUpdatedFromTable != startingLastChange)
					//System.out.println("bringUpToDate " + lastUpdatedFromTable + " - " + startingLastChange + " " + (this instanceof RootIndexNode ? ((RootIndexNode)this).propertyName : "") + " " + this);
					synchronized (writeListeners) {
						writeListeners.remove(writeListener);
					}
					if(startingLastChange > lastUpdatedFromTable){
						lastUpdatedFromTable = startingLastChange;
					}
					updateNode();
					if(Method.profiling)
						Method.stopTiming(startTime, bringIndexUpToDateMethod);
					
				}
			}
		}
	}

	final static Object REMOVE_KEY = new Object();
	final static IndexNodeUpdate NOP_UPDATE = new IndexNodeUpdate(null, false, Long.MAX_VALUE - 1, null);
	static class IndexNodeUpdate {
		Object key;
		boolean add;
		long target;
		boolean north;
		
		public IndexNodeUpdate(Object key, boolean add, long target, RootIndexNode index) {
			super();
			if ((key instanceof String) && ((String) key).length() > 1000) {
				key = "__TOO_LARGE__";
			}
			if(key instanceof Persistable){
				key = ((Persistable)key).getId();
			}
			this.key = key;
			this.add = add;
			this.target = target;
			if(index != null){
				synchronized(index.updateCountLock) {
					this.north = index.north;
					if(this.north){
						index.northWaiting++;
					}else{
						index.southWaiting++;
					}
				}
			}

		}
	}
	interface PrioritizedTask {
		public void run() throws IOException;
		public long getPriority();
	}
	/**
	 * this service handles the concurrent updating of index nodes as individual
	 * tasks
	 */
	static PriorityBlockingQueue<PrioritizedTask> indexQueue = new PriorityBlockingQueue<PrioritizedTask>(8, new Comparator<PrioritizedTask>(){

		public int compare(PrioritizedTask a, PrioritizedTask b) {
			long ap = a.getPriority();
			long bp = b.getPriority();
			if (ap > bp)
				return 1;
			if (bp > ap)
				return -1;
			return 0;
		}
		
	});
	static class InProcessTask {
		RootIndexNode rootNode;
		long outstandingReference;
	}
	static List<InProcessTask> currentlyBeingProcessed = new ArrayList(4);
	static {
        final ThreadGroup group = Thread.currentThread().getThreadGroup();
        final AtomicInteger threadNumber = new AtomicInteger(1);
        final String namePrefix = "index-thread-";
		for(int i = 0; i < 4; i++){
			// creates threads as daemons with a lower priority
            Thread t = new Thread(group,
                                  namePrefix + threadNumber.getAndIncrement()){

				@Override
				public void run() {
					while(true){
						try{
							PrioritizedTask task = indexQueue.take();
							//LogFactory.getLog(JavaScriptDB.class).info("executing task " + task + " remaining " + indexQueue.size());
							task.run();
						}
						catch(Throwable t){
							LogFactory.getLog(JavaScriptDB.class).error("Error occurred during indexing, the index may need to be rebuilt", t);
						}
					}
				}
            	
            };
            t.setDaemon(true);
            t.setPriority(2);
            t.start();
		}
	}
	AtomicInteger objectsNeedingIndexingCount = new AtomicInteger();
	public static final int OBJECTS_NEEDING_INDEX_THRESHOLD = 100;
	static Method updateIndexMethod = new Method("$JavaScriptDBSource.updateIndex");
	static Method bringIndexUpToDateMethod = new Method("$JavaScriptDBSource.bringIndexUpToDate");
	static Method writeIndexMethod = new Method("$JavaScriptDBSource.writeIndex");
	static long indexUpdateCounter = 0; 
	/**
	 * This represents an index node that has a list of entries pointing to
	 * different objects or sub index nodes
	 * 
	 * @author Kris
	 * 
	 */
	class IndexNode implements PrioritizedTask {
		public long getPriority() {
			return indexUpdateId + (depth * 200);
		}
		long indexUpdateId; 
		volatile boolean inQueue;
		byte depth;
		long reference;
		volatile int northToBeWritten;
		volatile int southToBeWritten;

		volatile IndexEntry[] entries;
		Queue<IndexNodeUpdate> objectsNeedingIndexing;
		void submitIfNeeded(boolean submit) throws IOException {
			Queue<IndexNodeUpdate> objectsNeedingIndexingLocal = objectsNeedingIndexing;
			if(objectsNeedingIndexingLocal != null && objectsNeedingIndexingLocal.size() > OBJECTS_NEEDING_INDEX_THRESHOLD)
				updateNode();
			else if (submit && !inQueue){
				inQueue = true;
				indexUpdateId = indexUpdateCounter++;
				indexQueue.add(this);
			}
		}
		boolean addToObjectsNeedingIndex(IndexNodeUpdate update) throws IOException {
			// get a thread-safe local copy
			Queue<IndexNodeUpdate> objectsNeedingIndexingLocal = objectsNeedingIndexing;
			if (objectsNeedingIndexingLocal == null) {
				// nothing in queue, we can safely create one and trigger the task service
				objectsNeedingIndexingLocal = new LinkedList<IndexNodeUpdate>();
				objectsNeedingIndexingLocal.add(update);
				objectsNeedingIndexing = objectsNeedingIndexingLocal;
				objectsNeedingIndexingCount.incrementAndGet();
				return true;
			}
			boolean needsSubmit;
			// we just need to be careful that we don't update this list while the task service is iterating on it
			synchronized (objectsNeedingIndexingLocal) {
				needsSubmit = objectsNeedingIndexingLocal.isEmpty();
				objectsNeedingIndexingLocal.add(update);
			}
			objectsNeedingIndexingCount.incrementAndGet();
			return needsSubmit;
		}
		public RootIndexNode getRoot() {
			return parentIndex.getRoot();
		}
		void readHeader(DataInput input) throws IOException {
			depth = input.readByte();
		}

		IndexNode(IndexNode parentIndex) throws IOException {
			synchronized (indexFile) {
				// creates a new node, allocating space for it
				reference = getIndexFile().length();
				getIndexFile().seek(reference);
				getIndexFile().write(new byte[INDEX_NODE_SIZE]);
			}
			entries = new IndexEntry[0];
			this.parentIndex = parentIndex;
			write();
		}

		private IndexNode(long reference) throws IOException {
			this.reference = reference;
			RandomAccessFile rafile = getIndexFile();
			rafile.seek(reference);
			BufferedDataInput bdi = new BufferedDataInput(rafile);
			readHeader(bdi);
			List<IndexEntry> entriesList = new ArrayList<IndexEntry>(100);
			Object upperBound;
			while ((upperBound = readEntity(bdi, false, false)) != END_OF_LIST) {

				byte start;
				do {
					// see it is a reference first
					bdi.mark();
					start = bdi.readByte();
					bdi.goBackOne();
					if (start == HEADER_INDEX_REFERENCE_INTEGER || start == HEADER_INDEX_REFERENCE_LONG) {
						// it is a reference, continue
						reference = readVarLong(bdi);
						entriesList.add((IndexEntry) (depth == 0 ? new IndexEntry(upperBound, reference) : new BranchEntry(upperBound, reference,
								readVarLong(bdi))));
					} else
						break;
				} while (true);
				//TODO: Make the last one a special entry that records the size of the linked list  
			}
			allDescendants = bdi.readLong();
			entries = new IndexEntry[entriesList.size()];
			entriesList.toArray(entries);
		}

		IndexNode loadChildIndexNode(long reference) throws IOException {
			IndexNode node = new IndexNode(reference);
			node.parentIndex = this;
			return node;
		}
		volatile boolean inWriteQueue;
		IndexNode parentIndex;
		long allDescendants;

		/**
		 * IndexNode can be treated as a runnable task (running updates the
		 * node)
		 */
		public void run() throws IOException {
			inQueue = false;
			updateNode();
		}

		synchronized IndexEntry[] addEntry(IndexEntry[] entries, int entryNum, IndexEntry newEntry) {
			IndexEntry[] newEntries = new IndexEntry[entries.length + 1];
			System.arraycopy(entries, 0, newEntries, 0, entryNum);
			newEntries[entryNum] = newEntry;
			if (entryNum < entries.length)
				System.arraycopy(entries, entryNum, newEntries, entryNum + 1, entries.length - entryNum);
			entries = newEntries;
			return entries;
		}

		void bringUpToDate() throws IOException {
			updateNode();
		}

		Object updateLock = new Object();
		private IndexNodeUpdate nextUpdate(){
			synchronized(objectsNeedingIndexing){
				return objectsNeedingIndexing.poll(); 
			}
		}
		/**
		 * Updates the index node with the currently queued changes
		 * 
		 * @throws IOException
		 */
		void updateNode() throws IOException {
			long startTime = 0;
			boolean dirty = false;
			
			synchronized (updateLock) {
				if(Method.profiling)
					startTime = Method.startTiming();
				if (objectsNeedingIndexing != null) {
					IndexNodeUpdate update;
					IndexEntry entry;
					for(;;){
						// this is synchronized against addToObjectsNeedIndexing method that adds to this list 
						if (depth > 0) {
							// we must not be synchronized here or we will get deadlocks
							while(true){
								boolean submit = false;
								IndexNode childNode = null;
								synchronized(this){
									update = nextUpdate(); 
									if(update == null)
										break;
									dirty = true;
									if(update != NOP_UPDATE){
										int[] entrySearch = findEntry(update.key, update.target, entries);
										int entryNum = entrySearch[0];
										assert entryNum < entries.length;
										entry = entries[entryNum];
										allDescendants += update.add ? 1 : -1;
										// delegate down to the next node
										childNode = ((BranchEntry) entry).getIndexNode(this);
										submit = childNode.addToObjectsNeedingIndex(update);
									}
								}
								// this must be done outside the synchronize to avoid deadlocks
								if(update != NOP_UPDATE)
									childNode.submitIfNeeded(submit);
								
							}
						} else {
							synchronized (this) { // must synchronized because we will be modifying the entries
								if (depth > 0) // it became a parent while we were waiting 
									continue;
								while((update = nextUpdate()) != null) {
									dirty = true;
									if(update != NOP_UPDATE){
	
										int[] entrySearch = findEntry(update.key, update.target, entries);
										int entryNum = entrySearch[0];
										boolean found = entrySearch[1] == 1;
										entry = entryNum < entries.length ? entries[entryNum] : null;
										if ((entries.length) != allDescendants && parentIndex instanceof RootIndexNode
												&& "id".equals(((RootIndexNode) parentIndex).propertyName) && depth == 0)
											throw new IllegalStateException("entry count does not equal descendants");
	
										//System.err.println("indexing " + update.target + update.add + (this instanceof RootIndexNode ? ((RootIndexNode)this).propertyName : "") + " " + this);
										if (update.add) {
											// we are adding
											if(!found){ // this should basically only be found in startup
												allDescendants++;
												entries = addEntry(entries, entryNum, new IndexEntry(update.key, update.target));
	/*											if (entryNum > 0 && this instanceof RootIndexNode && "id".equals(((RootIndexNode) this).propertyName)
														&& update.key.equals(entries[entryNum - 1].upperBound))
													throw new IllegalStateException("remove this");*/
											}
	
										} else {
											
											// we are removing the entry
											if (found) {
												allDescendants--;
												// create a new array with the empty entry removed
												IndexEntry[] newEntries = new IndexEntry[entries.length - 1];
												System.arraycopy(entries, 0, newEntries, 0, entryNum);
												if (entryNum + 1 < entries.length)
													System.arraycopy(entries, entryNum + 1, newEntries, entryNum, entries.length - entryNum - 1);
												entries = newEntries;
											}
										}
										if(update.north)
											northToBeWritten++;
										else
											southToBeWritten++;
	/*									if ((entries.length) != allDescendants && parentIndex instanceof RootIndexNode
												&& "id".equals(((RootIndexNode) parentIndex).propertyName) && depth == 0)
											throw new IllegalStateException("entry count does not equal descendants");*/
									}
								}
							}
						}
						break;
					}
					//objectsToIndexNow.clear();
				}

			}
			if(dirty){
				addToWriteQueue();
			}
			if(Method.profiling)
				Method.stopTiming(startTime, updateIndexMethod);
		}
		synchronized void addToWriteQueue() throws IOException {
			if(northToBeWritten + southToBeWritten > 150){
				write();
			}else if(!inWriteQueue){
				inWriteQueue = true;
				indexQueue.add(new PrioritizedTask(){
					long indexUpdateId = indexUpdateCounter++;
					public long getPriority() {
						return indexUpdateId + 1000;
					}

					public void run() throws IOException {
						inWriteQueue = false;
						write();
					}
					
				});
			}
		}
		// Find the entry in the current node. Does not visit other nodes.
		// may want to allow a suggested entry for performance
		// the 0x40000000 bit indicates whether or not it was found
		public int[] findEntry(Object key, long minimumReference, IndexEntry[] entries) {
			int upper = entries.length;
			int lower = 0;
			int pointer = upper / 2;
			IndexEntry entry;
			while (upper != lower) {
				// do a binary search
				entry = entries[pointer];
				int comparison = CompareValues.instance.compare(key, entry.upperBound);
				if (comparison == 0) {
					if (entry.objectReference == minimumReference) {
						return new int[] { pointer, 1 };
					}
					comparison = entry.objectReference > minimumReference ? -1 : 1;
				}
				if (comparison > 0)
					lower = pointer + 1;
				else
					upper = pointer;

				pointer = (lower + upper) / 2;
			}
			return new int[] { pointer, 0 };
		}

		void writeHeader(DataOutput output) throws IOException {
			output.writeByte(depth);
		}
		
		// This is the divide point within a splitting node
		final static int INDEX_DIVIDE_POINT = INDEX_NODE_SIZE / 2;
		final static int INDEX_DIVIDE_POINT_WITHIN_ENTRY = INDEX_NODE_SIZE * 3 / 5;
		final static int INDEX_SIZE_CUTOFF = INDEX_NODE_SIZE - 18;
		final static int INDEX_STRING_MAX_LENGTH = 400;

		synchronized void write() throws IOException {
			long startTime = 0;
			if(Method.profiling)
				startTime = Method.startTiming();

			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			DataOutputStream output = new DataOutputStream(baos);
			IndexEntry[] entries = this.entries;
			writeHeader(output);
			int dividePoint = -1;
			long descendantCount = 0;
			boolean countingDescendants = allDescendants == -1;
			Object lastUpperBound = new Object();
			for (int i = 0; i < entries.length; i++) {
				IndexEntry entry = entries[i];
				Object upperBound = entry.upperBound;
				if (lastUpperBound == null ? upperBound != null : !lastUpperBound.equals(upperBound)) {
					if (upperBound instanceof String){
						if (((String)upperBound).length() > INDEX_STRING_MAX_LENGTH)
							upperBound = ((String) upperBound).substring(0, INDEX_STRING_MAX_LENGTH);
					}
					else if (upperBound instanceof BinaryData){
						upperBound = "__binary__";
					}
					writeEntity(upperBound, output, WriteState.REFERENCE_IF_EXISTS);
					lastUpperBound = upperBound;
				}
				entry.writeReference(output);
				if (depth > 0) {
					writeVarLong(output, ((BranchEntry) entry).indexNodeReference);
				}
				if (countingDescendants) {
					if (depth == 0)
						descendantCount++;
					else
						descendantCount += ((BranchEntry) entry).getIndexNode(this).allDescendants;
				}
				if (output.size() > INDEX_DIVIDE_POINT && dividePoint == -1) {
					// this should make a good division point
					// TODO: maybe apply some hieristics to determine if it is an incrementing index,
					//	in which case we want the divide point to be near the end
					dividePoint = i;
				}
				if (output.size() > INDEX_SIZE_CUTOFF)
					break;
			}
			output.writeByte(HEADER_END);
			if (countingDescendants)
				allDescendants = descendantCount;
			// this might as well be fixed since, we can't don't know it's length a priori
			output.writeLong(allDescendants);
			byte[] bytes = baos.toByteArray();
			//TODO: reuse the bytes to do the write for this node if possible (need to keep a pointer into the bytes to do that)
			if (bytes.length > INDEX_SIZE_CUTOFF) {

				IndexNode secondNode = new IndexNode(parentIndex == null ? this : parentIndex);
				secondNode.depth = depth;
				secondNode.allDescendants = -1; // need to count the descendants when it is created
				IndexEntry[] secondNodeEntries = new IndexEntry[entries.length - dividePoint];
				secondNode.entries = secondNodeEntries;
				IndexEntry[] newEntries;
				// simple division along a key boundary
				newEntries = new IndexEntry[dividePoint];
				System.arraycopy(entries, 0, newEntries, 0, dividePoint);
				System.arraycopy(entries, dividePoint, secondNodeEntries, 0, entries.length - dividePoint);
				if (depth > 0) {
					// need to set the parents of all the children of secondNode to point to secondNode
					Reference<IndexNode> indexNodeRef;
					IndexNode childNode;
					for (IndexEntry entry : secondNodeEntries) {
						indexNodeRef = ((BranchEntry) entry).indexNodeRef;
						if (indexNodeRef != null) {
							childNode = indexNodeRef.get();
							// only need to update it if it is exists
							if (childNode != null) {
								childNode.parentIndex = secondNode;
							}
						}
					}
				}
				entries = newEntries;
				IndexEntry divideEntry = newEntries[newEntries.length - 1];
				if (parentIndex == null) {
					// split the root
					IndexNode newFirstNode = new IndexNode(this);
					newFirstNode.allDescendants = -1; // need to count the descendants when it is created
					if (depth > 0) {
						// need to set the parents of all the children of new first node to point to newFirstNode
						Reference<IndexNode> indexNodeRef;
						IndexNode childNode;
						for (IndexEntry entry : newEntries) {
							indexNodeRef = ((BranchEntry) entry).indexNodeRef;
							if (indexNodeRef != null) {
								childNode = indexNodeRef.get();
								// only need to update it if it is exists
								if (childNode != null) {
									childNode.parentIndex = newFirstNode;
								}
							}
						}
					}

					secondNode.parentIndex = this;
					newFirstNode.entries = newEntries;
					newFirstNode.depth = depth;
					entries = new IndexEntry[2];
					entries[0] = new BranchEntry(divideEntry.upperBound, divideEntry.objectReference, newFirstNode);
					entries[1] = new BranchEntry(NO_MAX, Long.MAX_VALUE, secondNode);
					this.entries = entries;
					depth++;
					//isLeaf = false; // it has children now, so it is no longer a leaf node
					// this is the proper order to make sure corruption can be detected if there is a problem
					// does the OS write the tracks in the same order we write them?
					write();
					newFirstNode.write();
					secondNode.write();
				} else {
					synchronized (parentIndex) {
						allDescendants = -1; // need to recount the descendants
						// create another node in the parent
						IndexEntry[] parentEntries = parentIndex.entries;
						int[] entrySearch = parentIndex.findEntry(divideEntry.upperBound, divideEntry.objectReference, parentEntries);
						int entryNum = entrySearch[0];
						boolean found = entrySearch[1] == 1;
						BranchEntry entry = (BranchEntry) parentEntries[entryNum];
						assert entry.indexNodeRef.get() == this;
						assert !found;
						BranchEntry secondNodeEntry = new BranchEntry(entry.upperBound, entry.objectReference, secondNode);
						// must have parentEntries completely ready before transferring
						parentEntries = parentIndex.addEntry(parentEntries, entryNum + 1, secondNodeEntry);
						parentEntries[entryNum] = new BranchEntry(divideEntry.upperBound, divideEntry.objectReference, this);
						secondNode.objectsNeedingIndexing = new LinkedList<IndexNodeUpdate>();
						boolean secondNodeSubmitNeeded = false;
						synchronized(secondNode.objectsNeedingIndexing){
							parentIndex.entries = parentEntries;
							secondNode.write();
							this.entries = entries;
							// now all the entries will be correctly routed, just need to fix the ones in the wrong queue now
						
							if(objectsNeedingIndexing != null){
								synchronized(objectsNeedingIndexing){
									// need to distribute queued changes between the split nodes
									List<IndexNodeUpdate> objectsToBeRemoved = new ArrayList<IndexNodeUpdate>();
									for(IndexNodeUpdate update : objectsNeedingIndexing){
										int comparison = CompareValues.instance.compare(update.key, divideEntry.upperBound);
										if(comparison == 0){
											comparison = update.target >= entry.objectReference ? 1 : -1;
										}
										if(comparison > 0){
											objectsToBeRemoved.add(update);
											if(secondNode.addToObjectsNeedingIndex(update))
												secondNodeSubmitNeeded = true;
										}
									}
									objectsNeedingIndexing.removeAll(objectsToBeRemoved);
										
								}
							}
						}
						// do the submission outside the sync block to avoid deadlock
						if (secondNodeSubmitNeeded)
							secondNode.submitIfNeeded(true);
						parentIndex.write();
					}
					write();
				}
			} else {
				RandomAccessFile raf = getIndexFile();
				raf.seek(reference);
				//System.err.println("writing index " + reference);
				raf.write(bytes);
				//System.err.println("finished writing index " + reference);
			}
			RootIndexNode root = getRoot();
			boolean updateNeeded = false;
			if(root != null && root.updateCountLock != null){
				synchronized(root.updateCountLock){
					root.northWaiting -= northToBeWritten;
					root.southWaiting -= southToBeWritten;
					if(root.north){
						if(root.southWaiting == 0){
							if(southToBeWritten > 0)
								updateNeeded = true;
							root.north = false;
							root.lastCommittedUpdateFromTable = root.southLastCommittedUpdateFromTable;
							root.northLastCommittedUpdateFromTable = root.lastUpdatedFromTable;
							// check to see if we can switch back
							if(root.northWaiting == 0){
								if(northToBeWritten > 0)
									updateNeeded = true;
								root.north = true;
								root.lastCommittedUpdateFromTable = root.northLastCommittedUpdateFromTable;
								root.southLastCommittedUpdateFromTable = root.lastUpdatedFromTable;
							}
						}
					}else{
						if(root.northWaiting == 0){
							if(northToBeWritten > 0)
								updateNeeded = true;
							root.north = true;
							root.lastCommittedUpdateFromTable = root.northLastCommittedUpdateFromTable;
							root.southLastCommittedUpdateFromTable = root.lastUpdatedFromTable;
							if(root.southWaiting == 0){
								if(southToBeWritten > 0)
									updateNeeded = true;
								root.north = false;
								root.lastCommittedUpdateFromTable = root.southLastCommittedUpdateFromTable;
								root.northLastCommittedUpdateFromTable = root.lastUpdatedFromTable;
							}
						}
					}
					northToBeWritten = 0;
					southToBeWritten = 0;
				}
			}
			if (updateNeeded){
				root.addToWriteQueue();
			}
			if(Method.profiling)
				Method.stopTiming(startTime, writeIndexMethod);

		}

		@Override
		protected void finalize() throws Throwable {
		}

	}
	boolean dirtyCommitNumber;

	/**
	 * This represents an entry in an index node that may have different
	 * existence levels for different transactions
	 * 
	 * @author Kris
	 * 
	 */
	static class TransactionalIndexEntry extends IndexEntry {
		// a pointer to the next in a series of entries that may be applicable depending on the transaction
		IndexEntry next;

		public TransactionalIndexEntry(IndexEntry next, Object upperBound, long value) {
			super(upperBound, value);
			this.next = next;
		}

	}

	//TODO: redo the hierarchy so that branches only need to keep an objectReference 
	// field if they are the same key as another entry in the node
	static class BranchEntry extends IndexEntry {
		public BranchEntry(Object upperBound, long objectReference, long indexNodeReference) {
			super(upperBound, objectReference);
			this.indexNodeReference = indexNodeReference;
		}

		public BranchEntry(Object upperBound, long objectReference, IndexNode indexNode) {
			super(upperBound, objectReference);
			this.indexNodeReference = indexNode.reference;
			this.indexNodeRef = new SoftReference<IndexNode>(indexNode);
		}

		//TODO: keep the allDescendants after indexNode is gc'ed
		//long allDescendants;
		Reference<IndexNode> indexNodeRef;
		long indexNodeReference;

		synchronized public IndexNode getIndexNode(IndexNode parentIndex) throws IOException {
			IndexNode node = indexNodeRef == null ? null : indexNodeRef.get();
			if (node == null) {
				indexNodeRef = new SoftReference<IndexNode>(node = parentIndex.loadChildIndexNode(indexNodeReference));
			}
			return node;
		}
	}

	/**
	 * This is an entry in an IndexNode
	 * 
	 * @author Kris
	 * 
	 */
	static class IndexEntry {
		Object upperBound;
		long objectReference;

		public IndexEntry(Object upperBound, long objectReference) {
			super();
			this.upperBound = upperBound;
			this.objectReference = objectReference;
		}

		void writeReference(DataOutput output) throws IOException {
			if (objectReference < Integer.MAX_VALUE && objectReference > Integer.MIN_VALUE) {
				output.writeByte(HEADER_INDEX_REFERENCE_INTEGER);
				output.writeInt((int) objectReference);
			} else {
				output.writeByte(HEADER_INDEX_REFERENCE_LONG);
				output.writeLong(objectReference);
			}
		}

	}

	class EmptyIndexTraverser extends IndexTraverser {

		public EmptyIndexTraverser(IndexNode node, int entryNumber, long objectReference) {
			super(node, entryNumber, objectReference);
		}

		public EmptyIndexTraverser(IndexNode node) {
			super(node);
		}

		@Override
		public void advance(long index) throws IOException {
		}

		@Override
		public IndexTraverser clone() {
			return new EmptyIndexTraverser(null);
		}

		@Override
		public boolean matches(Persistable obj) {
			return false;
		}

		@Override
		public long nextReference(long advance) throws IOException {
			return -1;
		}

		@Override
		public long size() throws IOException {
			return 0;
		}

	}

	IndexTraverser getTraverserForTable(String table, String propertyName) throws IOException {
		IndexNode node = getIndex(table, propertyName);
		return node == null ? new EmptyIndexTraverser(node) : new IndexTraverser(node);
	}

	static Object NO_MAX = CompareValues.BIGGEST;

	static long MIN_MIN_REFERENCE = -2;
	static long MAX_MAX_REFERENCE = Long.MAX_VALUE -1;
	class IndexTraverser extends JavaScriptDBSource.Traverser {
		IndexNode node;
		int entryNumber;
		Object minKey;
		int traversedCount;
		Object maxKey = NO_MAX;
		long minReference = MIN_MIN_REFERENCE;
		long maxReference = MAX_MAX_REFERENCE;
		long maxReferenceForCurrentKey = Long.MAX_VALUE;
		boolean reverse;
		boolean findingFirst = true;
		Object next;

		/**
		 * move forward to the given point in the index
		 */
		public void advance(long index) throws IOException {
			if(index > 0)
				nextReference(index);
		}

		@Override
		public boolean matches(Persistable obj) {
			IndexNode parent = node;
			while (!(parent instanceof RootIndexNode))
				parent = parent.parentIndex;
			String propertyName = ((RootIndexNode) parent).propertyName;
			Object value;
			if ("id".equals(propertyName)) {
				InternalId id = convertIdToInternalObject(obj.getId());
				if (id.tableId != ((RootIndexNode) parent).table)
					return false;
				value = id.subObjectId;
			}
			else {
				boolean wasSecurityEnabled = PersistableObject.isSecurityEnabled();
				PersistableObject.enableSecurity(false);
				value = obj.get(propertyName);
				PersistableObject.enableSecurity(wasSecurityEnabled);
			}
			int comparison = CompareValues.instance.compare(value, minKey);
			if (comparison < 0 || (minReference > MIN_MIN_REFERENCE && comparison == 0))
				return false;
			comparison = CompareValues.instance.compare(value, maxKey);
			if (comparison > 0 || (maxReference < MAX_MAX_REFERENCE && comparison == 0))
				return false;
			return true;
		}
		public long size() throws IOException {
			node.bringUpToDate();
			// make sure the headers are loaded
			IndexEntry[] entries = node.entries;
			if (minKey == null && maxKey == NO_MAX)
				return node.allDescendants;
			IndexEntry entry;
			long size = 0;
			int[] entrySearch = node.findEntry(minKey, minReference + 1, entries);
			int starting = entrySearch[0];
			boolean found = entrySearch[1] == 1;
			int entryNum = starting;
			boolean passedFirst = false;
			while (entryNum < entries.length) {
				entry = entries[entryNum++];
				int comparison = CompareValues.instance.compare(((IndexEntry) entry).upperBound, maxKey);
				if(comparison == 0){
					if(entry.objectReference < maxReference)
						comparison = -1;
					else if(entry.objectReference > maxReference)
						comparison = 1;
				}

				boolean last = comparison > 0;
				if (node.depth == 0 && last)
					break;
				if (node.depth == 0)
					size++;
				else {
					if (comparison < 0 && passedFirst) {
						// load the node and get the count
						size += ((BranchEntry) entry).getIndexNode(node).allDescendants;
					} else {
						// otherwise we need to actually count
						IndexNode currentNode = node;
						IndexEntry[] currentEntries = entries;
						node = ((BranchEntry) entry).getIndexNode(node);
						size += size();
						node = currentNode;
						entries = currentEntries;
					}
				}
				if (last)
					break;
				passedFirst = true;
			}
			return size;
		}

		ParentTraversePoint parent;
		
		class ParentTraversePoint {
			ParentTraversePoint parent;
			BranchEntry entry;

			public ParentTraversePoint(BranchEntry entry, ParentTraversePoint parent) {
				this.entry = entry;
				this.parent = parent;
			}
		}

		public Persistable nextObject() throws IOException {
			long reference = nextReference(1);
			return (Persistable) (reference == -1 ? null : getInstanceByReference(reference));
		}

		public long nextReference(long advance) throws IOException {
			if (node == null)
				return -1;
			//TODO: go to the next entry node by number for improved performance, and just use findEntry if we get out of sync
			/*
			 * if(entryNumber) entryNumber++;
			 */
			IndexEntry entry;
			int entryNum;
			while(advance > 0){
				node.bringUpToDate();
				IndexEntry[] entries = node.entries;
				if(reverse){
					int[] entrySearch = node.findEntry(maxKey, maxReference, entries);
					entryNum = entrySearch[0];
					boolean found = entrySearch[1] == 1;
					if (!findingFirst) {
						// move ahead if we can't equal the current key
						entryNum--;
					}
					if (entryNum >= entries.length){
						entryNum = entries.length - 1;
					}
					if (entryNum == -1) {
						// we are have traversed beyond the edge of this node, go to the parent and do the next node
						IndexNode parentIndex = node.parentIndex;
						if (parentIndex == null)
							// no where else to go, we are past all the indexed values
							return -1;
		
						maxKey = parent.entry.upperBound;
						maxReference = parent.entry.objectReference;
		
						parent = parent.parent;
						node = parentIndex;
						// continue processing from the parent
						continue;
					}
					entry = entries[entryNum];
					if (node.depth != 0) {
						// we are in a branch node, we must go back down into the children
						// first we will store the traverse information as a parent to the child
						parent = new ParentTraversePoint((BranchEntry) entry, parent);
						node = ((BranchEntry) entry).getIndexNode(node);
						continue;
					}
					if (minKey != null) {
						// see if we have passed the minimum key
						int comparison = CompareValues.instance.compare(entry.upperBound, minKey);
						if(comparison == 0){
							if(entry.objectReference < minReference)
								comparison = -1;
							else if(entry.objectReference > minReference)
								comparison = 1;
						}
						if (comparison < 0)
							return -1;
					}
	
				}
				else{
					int[] entrySearch = node.findEntry(minKey, minReference + 1, entries);
					entryNum = entrySearch[0];
					if (entryNum >= entries.length) {
						// we are have traversed beyond the edge of this node, go to the parent and do the next node
						IndexNode parentIndex = node.parentIndex;
						if (parentIndex == null)
							// no where else to go, we are past all the indexed values
							return -1;
		
						minKey = parent.entry.upperBound;
						minReference = parent.entry.objectReference;
						if (minKey == NO_MAX && minReference == Long.MAX_VALUE)
							return -1; // we can't go any further than this
		
						parent = parent.parent;
						node = parentIndex;
						// continue processing from the parent
						continue;
					}
					entry = entries[entryNum];
					if (node.depth != 0) {
						// we are in a branch node, we must go back down into the children
						// first we will store the traverse information as a parent to the child
						parent = new ParentTraversePoint((BranchEntry) entry, parent);
						node = ((BranchEntry) entry).getIndexNode(node);
						continue;
					}
					if (maxKey != NO_MAX) {
						// see if we have passed the maximum key
						int comparison = CompareValues.instance.compare(entry.upperBound, maxKey);
						if(comparison == 0){
							if(entry.objectReference < maxReference)
								comparison = -1;
							else if(entry.objectReference > maxReference)
								comparison = 1;
						}
						if (comparison > 0)
							return -1;
					}
					if(entry.objectReference > maxReferenceForCurrentKey && CompareValues.instance.compare(entry.upperBound, minKey) == 0) {
						minReference = entry.objectReference;
						continue;
					}
					IndexNode rootNode = node;
					while(!(rootNode instanceof RootIndexNode) && rootNode != null)
						rootNode = rootNode.parentIndex;
					if(rootNode != null)
						maxReferenceForCurrentKey = ((RootIndexNode)rootNode).lastUpdatedFromTable;
				}
				traversedCount++;
				findingFirst = false;
				// if we are in a leaf, we should be able to use the next entry now
				if(reverse){
					if(--advance > 0){
						entryNum -= advance;
						if(entryNum < 0){
							advance = -entryNum;
							entryNum = 0;
							entry = entries[entryNum];
							maxKey = entry.upperBound;
							maxReference = entry.objectReference;
							continue;
						}
						else
							entry = entries[entryNum];
					}
					maxKey = entry.upperBound;
					return maxReference = entry.objectReference;
				}
				else{
					if(--advance > 0){
						entryNum += advance;
						traversedCount += advance;
						if(entryNum >= entries.length){
							advance = entryNum - entries.length + 1;
							traversedCount -= advance;
							entryNum = entries.length - 1;
							entry = entries[entryNum];
							minKey = entry.upperBound;
							minReference = entry.objectReference;
							continue;
						}
						else {
							entry = entries[entryNum];
						}
					}
					
					minKey = entry.upperBound;
					return minReference = entry.objectReference;
				}
			}
			throw new IllegalStateException();
			// this whole thing could be a last faster to avoid redundant binary searches
		}

		public IndexTraverser(IndexNode node) {
			this.node = node;
		}

		public IndexTraverser(IndexNode node, int entryNumber, long objectReference) {
			this.node = node;
			this.entryNumber = entryNumber;
			this.minReference = objectReference;
		}

		public IndexTraverser clone() {
			IndexTraverser clone = new IndexTraverser(node);
			clone.minKey = minKey;
			clone.maxKey = maxKey;
			clone.minReference = minReference;
			clone.maxReference= maxReference;
			return clone;
		}
	}

	JavaScriptDBSource transactionSource;
	JavaScriptDBSource objectSource;
	JavaScriptDBSource arraySource;
	Map<Persistable, Boolean> currentChangedObjects;
	volatile int writesInProgress;
	volatile int forcesWaiting;
	volatile Object forceLock = new Object();
	Object writeCountLock = new Object();
	Date transactionTime;
	Transaction transactionBeingWritten;
	List<Runnable> onCommitTasks;
	class PointerAwareOutputStream extends BufferedOutputStream {

		public PointerAwareOutputStream(OutputStream out) {
			super(out, 65536);
		}
		public void reset(){
			count = 0;
		}
		public long getFilePointer() throws IOException {
			return transactionLogFile.getFilePointer() + count;
		}
	}
	PointerAwareOutputStream transactionBuffer = new PointerAwareOutputStream(new OutputStream(){
		@Override
		public void write(byte[] b, int off, int len) throws IOException {
			transactionLogFile.write(b, off, len);
		}

		@Override
		public void write(int b) throws IOException {
			throw new UnsupportedOperationException("Not implemented yet");
		}
	});
	DataOutput transactionOut = new DataOutputStream(transactionBuffer);
	long transactionWritingFrom= -1;
	static Method commitMethod = new Method("$JavaScriptDBSource.commit");
	static Method commitToDiskMethod = new Method("$JavaScriptDBSource.commitToDisk");
	static Method commitAquireWriteLockMethod = new Method("$JavaScriptDBSource.commitAquireWriteLock");
	Thread freezeThread;
	/**
	 * Freezes the database, so no writes are made
	 */
	public void freeze(){
		if(freezeThread != null)
			throw new RuntimeException("The database is already frozen");
		freezeThread = new Thread(){
			public void run(){
				synchronized (transactionLogFile) {
					synchronized(this){
						notify();
					}
					synchronized(this){
						try{
							wait();
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
					}
				}
				
			}
		};
		synchronized(freezeThread){
			freezeThread.start();
			try {
				freezeThread.wait();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
	/**
	 * Unfreezes the database
	 */
	public void unfreeze(){
		if(freezeThread == null)
			throw new RuntimeException("The database is not frozen");
		synchronized(freezeThread){
			freezeThread.notify();
		}
		freezeThread = null;
	}
	long nextToOnCommit = 0; 
	long nextCommit = 0;
	Object onCommitLock = new Object();
	public void commitTransaction() throws Exception {
		long writeStartTime = 0, startTime = 0;
		if(Method.profiling)
			startTime = Method.startTiming();
		synchronized (writeCountLock) {
			writesInProgress++;
		}
		long thisCommit;
		boolean writeIntegrity = false;
		List<Runnable> localOnCommitTasks = new ArrayList<Runnable>();
		try {
			ObjectId transactionId = ObjectId.idForObject(transactionSource, Long.toString(getNextId(getTableId("Transaction"), true)));
			synchronized (transactionId) {
				PersistableInitializer historyInitializer = DataSourceHelper.initializeObject(transactionId);

				Object currentUser = UserSecurity.currentUser();
				if (currentUser instanceof UserSecurity.PriviledgedUser)
					currentUser = null;
				historyInitializer.setProperty("committer", currentUser);
				// this relies
				Map<Persistable, Boolean> changedObjects = Transaction.currentTransaction().getDirtyObjects();
				List<Persistable> changes = Persevere.newArray();
				Set<Persistable> changeSet = new HashSet();
				for(Persistable changedObject : changedObjects.keySet()){
					// we always rewrite the parent if it is a sub-object or sub-array
					while(changedObject.getParent() != null && !(changedObject.getParent().getId() instanceof Query)){// changedObject.getId().hidden()
						changedObject = changedObject.getParent();
					}
					if(!changeSet.contains(changedObject)){
						changeSet.add(changedObject);
						DataSource source = changedObject.getId().source;
						if(source instanceof JavaScriptDBSource){
							if (((JavaScriptDBSource)source).isWriteIntegrity())
								writeIntegrity = true;
							changes.add(changedObject);
						}
					}
				}
				historyInitializer.setProperty("changes", changes);
				Persistable newHistory = historyInitializer.getInitializingObject();
				long transactionWriteLockTime = 0;
				if(Method.profiling)
					transactionWriteLockTime = Method.startTiming();
				synchronized (transactionLogFile) { // we must write one at a time
					thisCommit = nextCommit++;
					if(Method.profiling)
						Method.stopTiming(transactionWriteLockTime, commitAquireWriteLockMethod);
					if(Method.profiling)
						writeStartTime = Method.startTiming();
					if(transactionWritingFrom > -1){
						// this means that a transaction write failed, need to revert
						transactionLogFile.seek(transactionWritingFrom);//transactionLogFile.getFilePointer()
						transactionBuffer.reset();
						// restore the write log tableLastChange map if the last one failed
						synchronized(tableLastChangeCommitted){
							for(Map.Entry<Integer,Long> entry : tableLastChangeCommitted.entrySet())
								tableLastChange.put(entry.getKey(), entry.getValue());
						}
					}
					transactionWritingFrom = transactionLogFile.getFilePointer();
					transactionBeingWritten = Transaction.currentTransaction();
					transactionTime = transactionBeingWritten.getTransactionTime();
					currentChangedObjects = changedObjects;
					// write the current transaction out
					onCommitTasks = localOnCommitTasks;
					writeEntity(newHistory, transactionOut, WriteState.HISTORY);
					transactionBuffer.flush();
					transactionWritingFrom = -1;
					//System.err.println("transaction log finsihed " + transactionLogFile.getFilePointer());
				}
				if(Method.profiling)
					Method.stopTiming(writeStartTime, commitToDiskMethod);
			}
		} finally {
			synchronized (writeCountLock) {
				writesInProgress--;
			}
		}
		//TODO: Write any binary files
		if (writeIntegrity){
			// do the force while allowing other threads to execute at the same time
			// this is the one we will act on now
			Object currentForceLock = forceLock;

			if (writesInProgress > forcesWaiting / 2) {
				// if other threads are currently writing, than we will wait for them to do the 
				//	force so multiple writes can be done with one force because it is so expensive
				synchronized (currentForceLock) {
					forcesWaiting++;
					currentForceLock.wait();
					return;
				}
			}
			// let them queue up again
			forcesWaiting = 0;
			// create a new force lock that the next set of writes will wait on
			forceLock = new Object();
			if (namesFileDirty) {
				namesFileDirty = false;
				namesFile.getChannel().force(false);
			}
			transactionLogFile.getChannel().force(false);
			synchronized (currentForceLock) {
				// all the threads that were waiting can now write
				currentForceLock.notifyAll();
			}
		}
		while(true){
			synchronized(onCommitLock){
				if(nextToOnCommit == thisCommit){
					for (Runnable task : localOnCommitTasks){
						task.run();
					}
					nextToOnCommit++;
					onCommitLock.notifyAll();
					break;
				}
				onCommitLock.wait();
			}
		}
		if(Method.profiling)
			Method.stopTiming(startTime, commitMethod);

	}

	
	
	/**
	 * Release the file locks.
    */    	
	public void release()
	{
		try {
			transactionLogFile.close();
			namesFile.close();
			statusFile.close();			
		}
		catch (IOException e) {
		   log.debug("exception while closing files ",e);   			
		}		
	}

}
