package org.persvr.datasource;

import java.io.IOException;
import java.util.AbstractList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.WeakHashMap;

import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.Token;
import org.persvr.data.DataSourceManager;
import org.persvr.data.Identification;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.ObjectNotFoundException;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableClass;
import org.persvr.data.Query;
import org.persvr.data.QueryCantBeHandled;
import org.persvr.data.QueryCollection;
import org.persvr.data.Transaction;
import org.persvr.data.Query.SortDirective;
import org.persvr.datasource.JavaScriptDB.IndexTraverser;
import org.persvr.datasource.JavaScriptDB.ObjectVersion;
import org.persvr.util.CompareValues;

/**
 * This is the dynamic JavaScript object database source. This is the default primary data
 * source used by Persevere.
 * 
 * @author Kris
 * 
 */


public class JavaScriptDBSource extends BaseDataSource implements WritableDataSource, DataSource,
		ListDataSource, SourceDeleteAware, UserAssignableIdSource, DestroyAwareDataSource {
		//TODO: Add this and implement it: ReferenceAwareDataSource, {
	/**
	 * This should be overridden by the Transaction table so it always reads the "current state" of instances
	 * @return
	 */
	static boolean thisVersion(){
		return false;
	}
	private static JavaScriptDB database;
	JavaScriptDBSource superSource;
	private boolean writeIntegrity;
	private boolean useUUIDs;
	public void initParameters(Map<String, Object> parameters) throws Exception {
		if(getDatabase() == null)
			database = new JavaScriptDB((String) parameters.get("location"));
		if("Transaction".equals(getId())){
			getDatabase().transactionSource = this;
		}
		if("Object".equals(getId())){
			getDatabase().objectSource = this;
		}
		if("Array".equals(getId())){
			getDatabase().arraySource = this;
		}		
		if(Boolean.TRUE.equals(parameters.get("writeIntegrity")))
			writeIntegrity = true;
		if(Boolean.TRUE.equals(parameters.get("useUUIDs")))
			useUUIDs = true;
/*		Object superTypeObject = parameters.get("extends");
		if(superTypeObject != null && !(superTypeObject instanceof String)){
			throw new RuntimeException("The extends property for a data source configuration must be a string");
		}
		String superType = (String) superTypeObject;	
		if (superType != null && !"".equals(superType)) {
			superSource = (JavaScriptDBSource) DataSourceManager.getSource(superType);
			if(superSource == null)
				throw new RuntimeException("Can not extend non-existent class " + superType);
			superSource.subTypes.add(getId());
		}*/
		getDatabase().getTableId(getId());
	}
	public static void initialize(){
		if(getDatabase() != null)
			try {
				getDatabase().initialize();
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
	}
	
	
	
    public String newId() {
    	try {
			return isUseUUIDs() ?
					UUID.randomUUID().toString() :
					Long.toString(getDatabase().getNextId(getDatabase().getTableId(getId()), true));
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	/**
    * Called to close files that are used by the data source.      
    */
	public void destroy() {	  
	   getDatabase().release();		
	}
	
	
	static Map<Transaction, Long> commitedTransactions = Collections.synchronizedMap(new WeakHashMap<Transaction, Long>());
	public void commitTransaction() throws Exception {
		Transaction currentTransaction = Transaction.currentTransaction();
		Long transactionTime = new Long(currentTransaction.getTransactionTime().getTime());
		// we just need to call database commitTransaction once for a given transaction
		if(!transactionTime.equals(commitedTransactions.get(currentTransaction))){
			commitedTransactions.put(currentTransaction, transactionTime);
			getDatabase().commitTransaction();
		}
	}
	
	public void mapObject(PersistableInitializer initializer, String objectId) throws Exception{
		boolean subObject = objectId.indexOf('-') > -1 && ("Array".equals(getId()) || "Object".equals(getId()));
		IndexTraverser traverser = getDatabase().getTraverserForTable(
				subObject ? getDatabase().internedStrings.get(getDatabase().convertIdToInternalObject(ObjectId.idForObject(this, objectId)).tableId) : 
					getId(), "id");
		if(subObject){
			objectId = objectId.substring(objectId.indexOf('-') + 1);
		}
		int version = -1;
		Object noVersionObjectId = objectId;

		if(objectId.indexOf("-v") > 0){
			version = Integer.parseInt(objectId.substring(objectId.indexOf("-v") + 2));
			noVersionObjectId = objectId.substring(0, objectId.indexOf("-v"));
		}
		try{
			noVersionObjectId = Long.parseLong((String) noVersionObjectId);
		}catch(NumberFormatException e){
		}
		traverser.minKey = noVersionObjectId;
		traverser.maxKey = noVersionObjectId;
		Persistable object;
		// this should trigger the loading of the object 
		if((object = (Persistable) traverser.nextObject()) == null){
			throw new ObjectNotFoundException(this, objectId);
		}
		//FIXME: remove this
/*		if((Persistable) traverser.nextObject() != null){
			throw new IllegalStateException("shouldn't be duplicate ids");
		}*/
		
		// if a version was specified, we need to make sure we load it
		if(version > -1){
			while(((ObjectVersion) object.getVersion()).versionNumber > version){
				object = getDatabase().getVersionByReference(((ObjectVersion) object.getVersion()).previousVersionReference);
			}
			if(((ObjectVersion) object.getVersion()).versionNumber != version)
				throw new ObjectNotFoundException(this, objectId);
		}
	}

	public void recordDelete(String objectId) throws Exception {
		if(getDatabase().transactionSource == this)
			throw new RuntimeException("Can not delete transactions");
	}
	public NewObjectPersister recordNewObject(final Persistable object) throws Exception {
		if(getDatabase().transactionSource == this)
			throw new RuntimeException("Can not directly create transactions");

		return new StartAsEmptyPersister(){
			String id;
			public String getObjectId() {
				if(id == null) {
					try {
						if(object.getId().subObjectId.startsWith("s$")) {
							id = isUseUUIDs() ?
								UUID.randomUUID().toString() :
									Long.toString(getDatabase().getNextId(getDatabase().getTableId(getId()), true));
						}
						else{
							id = object.getId().subObjectId;
						}
					} catch (IOException e) {
						throw new RuntimeException(e);
					}
				}
				return id;
			}

			public DataSource getSource() {
				return JavaScriptDBSource.this;
			}

			public boolean isHiddenId() {
				return false;
			}
			
		};
	}
	public void recordPropertyAddition(String objectId, String name, Object value, int attributes) throws Exception {
		if(getDatabase().transactionSource == this)
			throw new RuntimeException("Can not modify transactions");
	}
	public void recordPropertyChange(String objectId, String name, Object value, int attributes) throws Exception {
		if(getDatabase().transactionSource == this)
			throw new RuntimeException("Can not modify transactions");
	}
	public void recordPropertyRemoval(String objectId, String name) throws Exception {
		if(getDatabase().transactionSource == this)
			throw new RuntimeException("Can not modify transactions");
	}
	public void abortTransaction() throws Exception {
	}
	public void startTransaction() throws Exception {
	}
	public void setIdSequence(long nextId) {
		try {
			getDatabase().setIdSeq(getDatabase().getTableId(getId()), nextId);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	public boolean isIdAssignable(String id) {
		try {
			// all the numbered ids are allocated for auto-assignment
			long longId = Long.parseLong(id);
			try {
				return getDatabase().getNextId(getDatabase().getTableId(getId()), false) > longId;
			} catch (IOException e) {
				throw new RuntimeException(e);
			} 
		} catch(NumberFormatException e){
			return true;
		}
	}
	/**
	 * Implements a list that represents the results of a query
	 * @author Kris
	 */
	class IndexTraverserQueryList extends AbstractList implements QueryCollection {
		Query query;
		int start;
		int end;
		IndexTraverserQueryList(Query query){
			// check to make sure we can handle the query
			try {
				Traverser traverser = createTraverser(query.getCondition(), getId());
				if(query.getSort() != null && traverser.estimatedSize(0) < Math.sqrt(getDatabase().getTraverserForTable(getId(), "id").estimatedSize(0)))
					// TODO: We also need to check to see if the sourceTraverser is already in the correct order, or can be sorted by simply reversing it
					throw new QueryCantBeHandled("Sort more efficient to be handled by an iterator");
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
			this.query = query;
		}
		@Override
		public Object get(int index) {
			throw new UnsupportedOperationException("Not implemented yet");
		}
		private Traverser createSortedTraverserWithSubclasses(List<SortDirective> sorts, Traverser traverser)throws IOException {
			Traverser sortTraverser = new SortTraverser(sorts.get(0).expression.getLastChild().getString(), getId(), sorts.get(0).ascending, traverser);
			for(PersistableClass subType : DataSourceManager.getObjectsClass(JavaScriptDBSource.this).schema.getSubTypes()){
				sortTraverser = new CombinedTraverser(sortTraverser, new SortTraverser(sorts.get(0).expression.getLastChild().getString(), subType.getId().subObjectId, sorts.get(0).ascending, traverser));
			}
			return sortTraverser;
			
		}
		private Traverser createTraverserWithSubclasses(Node expression, DataSource source) throws IOException {
			Traverser traverser = createTraverser(expression, source.getId());
			  
			for(PersistableClass subType : DataSourceManager.getObjectsClass(source).schema.getSubTypes()){
				DataSource subSource = DataSourceManager.getSource(subType.getId().subObjectId);
				if (subSource instanceof JavaScriptDBSource)
					traverser = new CombinedTraverser(traverser, createTraverserWithSubclasses(expression, subSource));
				else
					throw new RuntimeException("Can not extend a table that is not a JavaScriptDBSource table");
			}
			return traverser;
		}
		private Traverser createTraverser(Node expression, String table) throws IOException {
			if(expression == null)
				return getDatabase().getTraverserForTable(table, "id");
			try {
				boolean not = false; 
				switch(expression.getType()){
					case Token.AND:
					case Token.BITAND:
						return new AndTraverser(createTraverser(expression.getFirstChild(), table),createTraverser(expression.getLastChild(), table));
					case Token.OR:
					case Token.BITOR:
						return new OrTraverser(createTraverser(expression.getFirstChild(), table),createTraverser(expression.getLastChild(), table));
					case Token.NOT:
						return new NotTraverser(createTraverser(expression.getFirstChild(), table), table);
					case Token.SHNE:
					case Token.NE:
						not = true;
					case Token.EQ:
					case Token.GE:
					case Token.GT:
					case Token.LE:
					case Token.LT:
					case Token.SHEQ:
						String property;
						Object value;
						try {
							if(!(expression.getFirstChild().getType() == Token.GETPROP && expression.getFirstChild().getFirstChild().getType() == Token.THIS))
								throw new QueryCantBeHandled("Can't handle non-direct property comparisons");
							property = expression.getFirstChild().getLastChild().getString();
							Node valueNode = expression.getLastChild();
							switch(valueNode.getType()){
								case Token.STRING:
									value = valueNode.getString();
									break;
								case Token.NUMBER:
									value = valueNode.getDouble();
									break;
								case Token.NULL:
									value = null;
									break;
								case Token.TRUE:
									value = true;
									break;
								case Token.FALSE:
									value = false;
									break;
								case Token.AND:
									if(valueNode.getLastChild().getType() == Token.GETPROP && "__ids__".equals(valueNode.getLastChild().getFirstChild().getString())){
										value = Identification.idForString(valueNode.getFirstChild().getString());
										break;
									}
									throw new QueryCantBeHandled("unknown value type");
								case Token.CALL:
									if(valueNode.getFirstChild().getType() == Token.NAME &&
											"date".equals(valueNode.getFirstChild().getString())){
										value = new Date((long) valueNode.getLastChild().getDouble());
										break;
									}
								default:
									throw new QueryCantBeHandled("unknown value type");
							}
						} catch (RuntimeException e) {
							throw new QueryCantBeHandled("not valid structure");
						}
						IndexTraverser traverser = getDatabase().getTraverserForTable(table, property);
						switch(expression.getType()){		
							case Token.SHNE:
							case Token.NE:
							case Token.SHEQ:
							case Token.EQ:
								traverser.minKey = value;
								traverser.maxKey = value;
								break;
							case Token.GE:
								traverser.minKey = value;
								break;
							case Token.GT:
								traverser.minReference = JavaScriptDB.MAX_MAX_REFERENCE;
								traverser.minKey = value;
								break;
							case Token.LE:
								traverser.maxKey = value;
								break;
							case Token.LT:
								traverser.maxKey = value;
								traverser.maxReference = JavaScriptDB.MIN_MIN_REFERENCE;
						}
						return not ? new NotTraverser(traverser, table) : traverser;
					default:
						throw new QueryCantBeHandled("Unknown expression");
				}
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
		@Override
		public Iterator<Persistable> iterator() {
			try {
				Traverser traverser = createTraverserWithSubclasses(query.getCondition(), JavaScriptDBSource.this);
				if(traverser == null)
					throw new QueryCantBeHandled("Property hasn't been indexed");
				if(query.getSort() != null){
					//TODO: only handle simple sorts
					traverser = createSortedTraverserWithSubclasses(query.getSort(), traverser);
				}
				traverser.advance(start);
				return new TraverserIterator(traverser, end == 0 ? Long.MAX_VALUE : end - start);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		@Override
		public List subList(int fromIndex, int toIndex) {
			IndexTraverserQueryList newList = new IndexTraverserQueryList(query);
			newList.start = fromIndex + start;
			newList.end = toIndex + start;
			return newList;
		}
		public int size() {
			try {
				Traverser traverser = createTraverserWithSubclasses(query.getCondition(), JavaScriptDBSource.this);
				if(traverser == null)
					throw new QueryCantBeHandled("Property hasn't been indexed");
				return (int) traverser.size();
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
		public long estimatedSize(long exactWithin) {
			try {
				Traverser traverser = createTraverserWithSubclasses(query.getCondition(), JavaScriptDBSource.this);
				if(traverser == null)
					throw new QueryCantBeHandled("Property hasn't been indexed");
				return traverser.estimatedSize(exactWithin);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
		
	}
	public Collection<Object> query(Query query) throws Exception {
		return new IndexTraverserQueryList(query);
	}

	public void recordList(String objectId, List<? extends Object> values) throws Exception {
	}

	public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	public void onDelete() throws Exception {
/*		for (String subType : subTypes) {
			DataSourceManager.deleteSource(subType);
		}*/
		//superSource.subTypes.remove(getId());
		getDatabase().deleteTable(getId());
	}

	public List<ObjectId> getReferrers(String objectId) {
		throw new UnsupportedOperationException("Not implemented yet");
	}
	/**
	 * Implements an Iterator for traversing indexes and retrieving the referenced objects
	 * @author Kris
	 */
	class TraverserIterator implements Iterator<Persistable> {
		Traverser traverser;
		Persistable next;
		long count;
		long maxLength;
		TraverserIterator(Traverser traverser, long maxLength){
			this.traverser = traverser;
			this.maxLength = maxLength;
		}
		public boolean hasNext() {
			try {
				if(count++ >= maxLength)
					return false;
				if(next == null){
					next = traverser.nextObject();
					if(next == null)
						return false;
				}
				return true;
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		public Persistable next() {
			try {
				if(next == null && count++ < maxLength)
					next = traverser.nextObject();
				Persistable value = next;
				next = null;
				return value;
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}

		public void remove() {
			throw new UnsupportedOperationException("Not implemented yet");
		}
		
	}
	static abstract class Traverser {
		public abstract Persistable nextObject() throws IOException;
		public abstract long size() throws IOException;
		public long estimatedSize(long exactWithin) throws IOException {
			return size();
		}
		public void advance(long start) throws IOException{
			for(long i = 0; i < start; i++)
				nextObject();
		}
		public abstract boolean matches(Persistable obj);
		public void reverse(){
			throw new UnsupportedOperationException("Not implemented yet");
		}
		public abstract Traverser clone();
	}
	static abstract class OrderedTraverser extends Traverser {
		Traverser small, big;
		public OrderedTraverser(Traverser left, Traverser right) throws IOException{
			if(left.estimatedSize(0) > right.estimatedSize(0)){
				small = right;
				big = left;
			}
			else{
				small = left;
				big = right;
			}
		}
		public OrderedTraverser clone(){
			try {
				return getClass().getConstructor(Traverser.class, Traverser.class).newInstance(small.clone(), big.clone());
			} catch (Throwable e) {
				throw new RuntimeException(e);
			}
		}
		public long size() throws IOException {
			long size = 0;
			while(nextObject()!=null){
				size++;
			}
			return size;
		}
	}
	static class AndTraverser extends OrderedTraverser{
		
		public AndTraverser(Traverser left, Traverser right) throws IOException{
			super(left, right);
		}
		long included = 1, smallTraversed = 1;
		public long estimatedSize(long exactWithin) throws IOException {
			// estimate the size based on the number that has been processed
			return included * small.estimatedSize(exactWithin) / smallTraversed;
		}
		public Persistable nextObject() throws IOException {
			Persistable potential;
			do{
				potential = small.nextObject();
				if(potential == null)
					return null;
				smallTraversed++;
			}while(!big.matches(potential));
			included++;
			return potential;
		}
		public boolean matches(Persistable obj) {
			return small.matches(obj) && big.matches(obj);
		}
	}
	static class CombinedTraverser extends OrderedTraverser{
		boolean processingBig = true;
		public CombinedTraverser(Traverser left, Traverser right) throws IOException {
			super(left, right);
		}
		public boolean matches(Persistable obj) {
			return small.matches(obj) || big.matches(obj);
		}
		public long estimatedSize(long exactWithin) throws IOException{
			// estimate the size based on the number that has been processed
			return small.estimatedSize(exactWithin) + big.estimatedSize(exactWithin);
		}
		public long size() throws IOException{
			return small.size() + big.size();
		}
		public Persistable nextObject() throws IOException {
			Persistable potential;
			if(processingBig){
				potential = big.nextObject();
				if(potential != null)
					return potential;
				processingBig = false;
			}
			return small.nextObject();
		}
		
	}
	static class OrTraverser extends CombinedTraverser{
		public OrTraverser(Traverser left, Traverser right) throws IOException {
			super(left, right);
			operand = big.clone();
		}
		long included = 0, smallTraversed = 1;
		Traverser operand;
		public long estimatedSize(long exactWithin) throws IOException{
			// estimate the size based on the number that has been processed
			return small.estimatedSize(exactWithin) + big.estimatedSize(exactWithin) - included * small.estimatedSize(exactWithin) / smallTraversed;
		}
		public Persistable nextObject() throws IOException {
			Persistable potential;
			if(processingBig){
				potential = big.nextObject();
				if(potential != null)
					return potential;
				processingBig = false;
			}
			do{
				potential = small.nextObject();
				if(potential == null)
					return null;
				smallTraversed++;
			}while(operand.matches(potential));
			included++;
			return potential;
		}
	}
	class NotTraverser extends Traverser {
		IndexTraverser indexTraverser;
		Traverser operand;
		String table;
		NotTraverser(Traverser traverser, String table) throws IOException{
			indexTraverser = getDatabase().getTraverserForTable(table, "id");
			operand = traverser;
			this.table = table;
		}
		long found;
		@Override
		public Persistable nextObject() throws IOException {
			while(true){
				Persistable potential = indexTraverser.nextObject();
				if(potential == null)
					return null;
				if(operand.matches(potential))
					found++;
				else
					return potential;				
			}
		}
		public long estimatedSize(long exactWithin) throws IOException {
			long size = indexTraverser.estimatedSize(exactWithin);
			advance(exactWithin);
			return size - found;
		}
		public long size() throws IOException {
			long size = 0;
			while(nextObject()!=null){
				size++;
			}
			return size;
		}
		@Override
		public boolean matches(Persistable obj) {
			return !operand.matches(obj);
		}
		@Override
		public NotTraverser clone() {
			try {
				return new NotTraverser(operand.clone(), table);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}			
		}
		
	}
	class CombinedSortTraverser extends Traverser {
		SortTraverser sortedA, sortedB;
		Persistable nextA, nextB;
		boolean aFinished, bFinished;
		String property;
		boolean ascending;
		public CombinedSortTraverser(String property, boolean ascending, SortTraverser sortedA, SortTraverser sortedB) throws IOException {
			this.sortedA = sortedA;
			this.sortedB = sortedB;
			this.property = property;
			this.ascending = ascending;
		}
		private CombinedSortTraverser(){
			
		}
		@Override
		public Traverser clone() {
			CombinedSortTraverser cst = new CombinedSortTraverser();
			cst.sortedA = sortedA;
			cst.sortedB = sortedB;
			return cst;
		}
		@Override
		public boolean matches(Persistable obj) {
			return sortedA.matches(obj);
		}
		
		@Override
		public Persistable nextObject() throws IOException {
			if(nextA == null && !aFinished){
				sortedA.nextObject();
				if(nextA == null)
					aFinished = true;
			}
			if(nextB == null && !bFinished){
				sortedB.nextObject();
				if(nextB == null)
					bFinished = true;
			}
			if(nextA == null)
				return nextB;
			if(nextB == null)
				return nextA;
			if(CompareValues.instance.compare(nextA.get(property, nextA), nextB.get(property, nextB)) > 0 == ascending)
				return nextB;
			return nextA;
		}
		@Override
		public long size() throws IOException {
			return sortedA.size() + sortedB.size();
		}
		@Override
		public long estimatedSize(long exactWithin) throws IOException {
			return sortedA.estimatedSize(exactWithin) + sortedB.estimatedSize(exactWithin);
		}
		
	}
	class SortTraverser extends Traverser {
		IndexTraverser sortedTraverser;
		Traverser operand;
		String property;
		String tableName;
		SortTraverser(String property, String tableName, boolean ascending, Traverser sourceTraverser) throws IOException{
			sortedTraverser = getDatabase().getTraverserForTable(tableName, property);
			this.tableName = tableName;
			this.property = property;
			this.operand = sourceTraverser;
			sortedTraverser.reverse = !ascending;
		}
		long found;
		@Override
		public Persistable nextObject() throws IOException {
			while(true){
				Persistable potential = sortedTraverser.nextObject();
				if(potential == null)
					return null;
				try{
					if(operand.matches(potential)){
						found++;
						return potential;
					}
				}catch(EcmaError e){
					// squelch
				}
			}
		}
		@Override
		public long size() throws IOException {
			return operand.size();
		}
		@Override
		public long estimatedSize(long exactWithin) throws IOException {
			return operand.estimatedSize(exactWithin);
		}
		@Override
		public boolean matches(Persistable obj) {
			return operand.matches(obj);
		}
		@Override
		public SortTraverser clone() {
			try {
				return new SortTraverser(property, tableName, sortedTraverser.reverse, operand.clone());
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
		}
		
	}
	public boolean isUseUUIDs() {
		if(Boolean.TRUE.equals(DataSourceManager.getObjectsClass(this).schema.get("useUUIDs"))){
			return true;
		}
		return useUUIDs;
	}
	public boolean isWriteIntegrity() {
		if(Boolean.TRUE.equals(DataSourceManager.getObjectsClass(this).schema.get("writeIntegrity"))){
			return true;
		}
		return writeIntegrity;
	}
	public static JavaScriptDB getDatabase() {
		return database;
	}
	
}
