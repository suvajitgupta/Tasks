package org.persvr.data;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.Collections;

import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.NewObjectPersister;
import org.persvr.datasource.WritableDataSource;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.remote.Client;
import org.persvr.remote.Client.IndividualRequest;


/**
 * This class represents a data transaction, tracking the changes to data so they can be atomically 
 * committed to a data source. Transactions are associated with threads.
 * @author Kris
 *
 */
public class Transaction {
	/**
	 * This is a single change to a data element
	 * @author Kris
	 *
	 */
	public static class ChangeUpdate {
		Persistable target; // the target object that was changed
		String key; // the name of the property that was changed
		boolean processed; // has the PUT fired for this?
		public ChangeUpdate(Persistable target, String key) {
			super();
			this.target = target;
			this.key = key;
		}
		
	}
	private Transaction() { 
	}
	private static long lastTransactionTime = 0;
	long transactionTime;
	
	protected boolean useSequences = false;
	protected HashSet<String> writerSet = new HashSet<String>();
	protected Client client;
	static ThreadLocal<Long> mySequenceId = new ThreadLocal<Long>();
	static ThreadLocal<String> threadIdentifier = new ThreadLocal<String>(){
		@Override protected String initialValue() {
			return UUID.randomUUID().toString();
		}
	};
	protected Long transactionId;
	protected boolean readyToCommit = false;
	protected boolean committed = false;
	protected Long commitSequenceId = null;

	public String getLabel(){
		return (transactionId!=null)? transactionId.toString() : this.toString();
	}
	
	/**
	 * If the data source is notifying us of a change, than this should be false so it won't need to be re-written
	 */
	private boolean writeToDataSource = true;
	public synchronized Map<Persistable,Boolean> getDirtyObjects(){
		Map<Persistable,Boolean> dirtyObjects = new HashMap<Persistable,Boolean>();
		for(NewObject newObject : newObjects)
			dirtyObjects.put(newObject.object, false);
		for(Map.Entry<TransactionValue,ChangeUpdate> change : changes.entrySet()){
			dirtyObjects.put(change.getValue().target, change.getValue().key == null && !(change.getValue().target instanceof List));
		}
		return dirtyObjects;
	}
	Map<TransactionValue,ChangeUpdate> changes = new HashMap<TransactionValue,ChangeUpdate>();
	/**
	 * Tracking a new object that was created
	 * @author Kris
	 *
	 */
	class NewObject{
		Persistable object;
		boolean processed;
		public NewObject(Persistable object) {
			super();
			this.object = object;
		}
		
	}
	List<NewObject> newObjects = new ArrayList<NewObject>();
	// create the executor service that will use up to four threads to send events to clients
	static ExecutorService notificationService = new ThreadPoolExecutor(4, 4, 60, TimeUnit.SECONDS, new LinkedBlockingQueue<Runnable>(5000));
	Map<PropertyChangeSetListener,List<ObservedCall>> observedCallSet = new HashMap<PropertyChangeSetListener,List<ObservedCall>>(1); // start small, often there won't be any listeners

	public static Map<PropertyChangeSetListener, List<ObservedCall>> getObservedCallSet() {
		return currentTransaction().observedCallSet;
	}
	public synchronized void addNewItem(Persistable newObject) {
		//System.out.println("Adding new item to " + getLabel());
		newObjects.add(new NewObject(newObject));
		if (this == OUTSIDE) {
			commit();
		}
	}
	static InheritableThreadLocal<Set<WritableDataSource>> currentDataSourcesAffected = new InheritableThreadLocal<Set<WritableDataSource>>();
	public static void addAffectedSource(WritableDataSource source) throws Exception{
		if (currentDataSourcesAffected.get().add(source) && commitsInProcess.containsKey(currentTransaction()))
			source.startTransaction();
	}
	/**
	 * This executes the put, post, and delete methods for the object that was modified, so that objects
	 * can implement handlers for these to validate changes
	 */
	public void restActions(){
		for (NewObject newObject : new ArrayList<NewObject>(newObjects)) {
			if(!newObject.processed){
				DataSource source = DataSourceManager.getSourceByPrototype(newObject.object.getPrototype());
				if (!("Array".equals(source.getId()) || "Object".equals(source.getId()))){
					Persistable rootQuery = ObjectId.idForObject(source,"").getTarget();
					Function postMethod = (Function) ScriptableObject.getProperty((Persistable) rootQuery, "post");
					if(postMethod instanceof Method)
						((Method)postMethod).call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), rootQuery, new Object[]{newObject.object}, true);
					else
						postMethod.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), rootQuery, new Object[]{newObject.object});
					Method onSave = (Method) ScriptableObject.getProperty(newObject.object, "onSave");
					onSave.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), newObject.object, new Object[0], true);
				}
				newObject.processed = true;
			}
		}
		Set<Persistable> changedObjects = new HashSet<Persistable>();
		Set<Persistable> deletedObjects = new HashSet<Persistable>();
		for (ChangeUpdate change : changes.values()) {
			if(!change.processed){
				Persistable object = change.target;
				DataSource source;
				if (change.key == null && !(object instanceof PersistableArray)) {
					deletedObjects.add(object);
					changedObjects.remove(object);
				}
				else if (!deletedObjects.contains(object)){
					do{
						// find the visible concrete parent
						source = DataSourceManager.getSourceByPrototype(object.getPrototype());
						if(object.getId().hidden()){
							object = object.getParent();
						}
					} while(object != null && object.getId().hidden());
					if (object != null)
						changedObjects.add(object);
				}
				change.processed = true;
			}
		}
		for (Persistable deletedObject : deletedObjects) {
			Method deleteMethod = (Method) ScriptableObject.getProperty(deletedObject, "delete");
			//TODO: Need to pass more information about the changes to the callee
			deleteMethod.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), deletedObject, new Object[0], true);
		
		}

		for (Persistable changedObject : changedObjects) {
			Method putMethod = (Method) ScriptableObject.getProperty(changedObject, "put");
			//TODO: Need to pass more information about the changes to the callee
			putMethod.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), changedObject, new Object[0], true);
			Method onSave = (Method) ScriptableObject.getProperty(changedObject, "onSave");
			onSave.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), changedObject, new Object[0], true);
			
		}
	}
	static Map<Transaction,Set<String>> commitsInProcess = Collections.synchronizedMap(new HashMap<Transaction,Set<String>>());
	static Method commitMethod = new Method("$commit");

	/**
	 * Commit the transaction
	 */
	public void commit(){
		if(client!=null){
			synchronized(client){
				syncCommit();
			}
		}else{
			syncCommit();
		}
	}
	
	public synchronized void setCommitSequenceId(Long commitSeqId){
		this.commitSequenceId = commitSeqId;
	}
	
	private synchronized void syncCommit(){
		readyToCommit = true;
//		System.out.println("!!! Ready To Commit: " + getLabel());
		//assumes that this thread is one of the readers
		Long sid = mySequenceId.get();
		if(sid!=null){
			commitSequenceId = sid; //store this so we can check for consistency later
		}
		writerSet.remove(threadIdentifier.get());
		commitIfReady();
	}
	
	public synchronized boolean canCommit(){
		//check if we can commit right now
		boolean canCommit = client==null || !useSequences;
		if(!canCommit){
			Long sid = (commitSequenceId==null)? mySequenceId.get() : commitSequenceId;
			canCommit = sid==null || (client.isConsistentToSequenceId(sid) && client.isConsistentToTransactionId(transactionId));
		}
		return canCommit && readyToCommit && writerSet.isEmpty();
	}
	
	public synchronized void commitIfReady(){
		if(canCommit()){
//			System.out.println("committing transaction: " + getLabel());
			try{
				doCommit();
			}finally{
				if(this.client!=null && transactionId!=null){
					client.clearOpenTransaction(transactionId);
				}
			}
		}
	}
	
	private synchronized void doCommit() {
		Transaction oldTransaction = transactions.get();
		if(oldTransaction!=this){
			//make sure we are executing in this transactions's context
			transactions.set(this);
		}
		if(transactionTime != 0){
//			System.out.println("cannot recommit");
			throw new RuntimeException("Can not recommit the same transaction");
		}
		long startTime = 0;
		if(Method.profiling)
			startTime = Method.startTiming();
		try{
	
			// implementing incremental time
			transactionTime = new Date().getTime();
			if (transactionTime <= lastTransactionTime) 
				transactionTime = lastTransactionTime + 1;
			lastTransactionTime = transactionTime; 
			// execute all the rest handlers
			restActions();
			//transactions.set(IMMEDIATE);
			// compile a set of all the changes
			Set<WritableDataSource> dataSourcesAffected = new HashSet<WritableDataSource>();
			currentDataSourcesAffected.set(dataSourcesAffected);
			Set<String> myChanges = new HashSet<String>();
			for (ChangeUpdate change : changes.values()) {
				myChanges.add(change.target.getId() + "," + change.key);
			}
			Transaction waitOnTransaction = this;
			// synchronize the transactions so any overlapping (in their changes) transactions execute in serial
			while(waitOnTransaction != null) {
				synchronized(commitsInProcess){
					waitOnTransaction = null;
					for (Entry<Transaction, Set<String>> commitProcess : commitsInProcess.entrySet()){
						for (String change : myChanges) {
							if (commitProcess.getValue().contains(change)){
								waitOnTransaction = commitProcess.getKey();
								break;
							}
						}
					}
					if(waitOnTransaction == null){
						commitsInProcess.put(this, myChanges);
					}
				}
				if(waitOnTransaction != null) {
					synchronized(waitOnTransaction){
						// wait for the transaction to finish
					}
					
				}
			}
			boolean wasSecurityEnabled = PersistableObject.isSecurityEnabled();
			
			try {
				// turn off security so no checks are made while we are persisting data
				PersistableObject.enableSecurity(false);
				// now write all the data to the datasources
				if(writeToDataSource){
					for (WritableDataSource source : dataSourcesAffected)
						source.startTransaction();
					for (NewObject newObject : newObjects) {
						WritableDataSource source = ((WritableDataSource) DataSourceManager.getSourceByPrototype((Persistable)newObject.object.getPrototype()));
						addAffectedSource(source);
						NewObjectPersister persister = source.recordNewObject(newObject.object);
						newObject.object.getId().persistIfNeeded(persister);
						if(newObject.object instanceof PersistableObject)
							((PersistableObject)newObject.object).lastModified = Transaction.currentTransaction().getTransactionTime();
						else
							((PersistableArray)newObject.object).lastModified = Transaction.currentTransaction().getTransactionTime();
	
					}
					for (Entry<TransactionValue,ChangeUpdate> changeEntry : changes.entrySet()) {
						PersistableObject.commitPut(changeEntry,this);
					}
					for (WritableDataSource source : dataSourcesAffected)
						source.commitTransaction();
				}
				// now make all the changes committed in the persisted objects so will 
				// be available to other threads
				// TODO: Needs to be timestamp based in order be atomic
				synchronized(commitsInProcess){
					for (Entry<TransactionValue,ChangeUpdate> changeEntry : changes.entrySet()) {
						TransactionValue transValue = changeEntry.getKey(); 
						ChangeUpdate change = changeEntry.getValue();
						Persistable target = change.target;
						Object sourceValue = transValue.values.get(this);
	
						if (target instanceof PersistableObject) {
							((PersistableObject) target).lastModified = getTransactionTime();
							if (transValue.commit(this)) {
								if (change.key != null){
									if(sourceValue instanceof Persistable && !(((Persistable)sourceValue).getId() instanceof NewObjectId))
										sourceValue = ((Persistable)sourceValue).getId();
									((PersistableObject) target).noCheckSet((String) change.key, sourceValue);
								}
							}
						}
						else if (target instanceof PersistableArray) {
							((PersistableArray) target).lastModified = getTransactionTime();
							if (change.key == null) {
								transValue.values.remove(this);
								// update the core Array with the transactional Array 
								int i = 0;
								for (Object value : (PersistableArray) sourceValue){
									if(value instanceof Persistable && !(((Persistable)value).getId() instanceof NewObjectId))
										value = ((Persistable)value).getId();
									((PersistableArray) target).noCheckSet(i++,value);
								}
								((PersistableArray) target).superPutLength(i);
							}
							//TODO: When a new value is added an array, we want to increment the other waiting transaction values indexes
						}
					}
	
					commitsInProcess.remove(this);
				}
			}
			catch (Exception e) {
				// it failed, rollback
				for (TransactionValue value : changes.keySet()) {
					value.abort(this);
				}
				for (WritableDataSource source : dataSourcesAffected)
					try {
						source.abortTransaction();
					} catch (Exception e1) {
						e1.printStackTrace();
					}
				
				observedCallSet.clear();
				throw new RuntimeException(e);
			}
			finally {
				// restore security
				PersistableObject.enableSecurity(wasSecurityEnabled);
				commitsInProcess.remove(this);
			}
		}
		finally{
			// clear out the old transaction
			if(this instanceof ImmediateTransaction){
				newObjects.clear();
				changes.clear();
			}
			if(oldTransaction!=this){
				transactions.set(oldTransaction);
			}else{
				transactions.remove();
			}
			committed = true;

			if(Method.profiling)
				Method.stopTiming(startTime, commitMethod);
			
		}
		// now fire all the notifications
		for (final Entry<PropertyChangeSetListener,List<ObservedCall>> entry : observedCallSet.entrySet()) {
			// submit it for processing by the notification service thread pool
			notificationService.submit(new Runnable(){
				public void run() {
					entry.getKey().propertyChange(entry.getValue());
				}
			});
		}
		observedCallSet.clear();
		
	}
	/**
	 * Abort a transaction
	 */
	public synchronized void abort() {
		for (TransactionValue value : changes.keySet()) {
			value.abort(this);
		}
		newObjects.clear();
		changes.clear();
		observedCallSet.clear();
	}
	// this represents data outside transactions, globally visible
	public static final Transaction OUTSIDE = new Transaction();
	static InheritableThreadLocal<Transaction> transactions = new InheritableThreadLocal<Transaction>();
	static Transaction startDataSourceInitiatedTransaction() {
		Transaction transaction = startTransaction();
		transaction.writeToDataSource = false;
		return transaction;
	}
	public static Transaction startTransaction() {
		Transaction oldTransaction = transactions.get();
		if(oldTransaction!=null && oldTransaction.client!=null){
			synchronized(oldTransaction.client){
				if(oldTransaction.transactionTime == 0){
					oldTransaction.leaveTransaction();
				}
			}
		}else{
			if(oldTransaction!=null && oldTransaction.transactionTime == 0){
				oldTransaction.leaveTransaction();
			}
		}
		
		Transaction transaction = new Transaction();
		//System.out.println("starting transaction: " + transaction.toString());
		if(Client.getCurrentObjectResponse()!=null){
			transaction.client = Client.getCurrentObjectResponse().getConnection();
		}
		transaction.writerSet.add(threadIdentifier.get());
		transactions.set(transaction);
		return transaction;
	}
	
	public static Transaction startTransaction(Long sequenceId, Long transactionId) {
		Transaction oldTransaction = transactions.get();
		if(oldTransaction!=null && oldTransaction.client!=null){
			synchronized(oldTransaction.client){
				if(oldTransaction.transactionTime == 0){
					oldTransaction.leaveTransaction();
				}
			}
		}else{
			if(oldTransaction!=null && oldTransaction.transactionTime == 0){
				oldTransaction.leaveTransaction();
			}
		}
		
		Transaction transaction = new Transaction();
//		System.out.println("starting transaction " + transactionId.toString()+ " w/seq: " + sequenceId.toString());
		transactions.set(transaction);
		synchronized(transaction){
			transaction.useSequences = true;
			transaction.writerSet.add(threadIdentifier.get());
			transaction.mySequenceId.set(sequenceId);
			transaction.transactionId = transactionId;
			transaction.client = Client.getCurrentObjectResponse().getConnection();
		}
		return transaction;
	}
	
	/**
	 * Re-enter an open transaction, register it as the transaction for this thread, and register this thread as a writer for the transaction
	 */
	public synchronized void enterTransaction() {
		if(committed) throw new RuntimeException("Entering a previously committed transaction");
		//System.out.println("entering transaction: " + this.toString());
		writerSet.add(threadIdentifier.get());
		transactions.set(this);
	}
	
	public synchronized void enterTransaction(Long sequenceId) {
		if(committed) {
			throw new RuntimeException("Entering a previously committed transaction");
		}
		if(!useSequences){
			throw new RuntimeException("Transaction not initialized properly for sequence use");
		}
		
//		System.out.println("entering transaction " + getLabel() + " w/seq: " + sequenceId.toString());
		writerSet.add(threadIdentifier.get());
		mySequenceId.set(sequenceId);
		transactions.set(this);

	}
	/**
	 * Signal that the thread is done with this transaction
	 */
	protected void leaveTransaction() {
		synchronized(this){
			writerSet.remove(threadIdentifier.get());
		}
		if(transactionTime==0){
			//if this transaction has not yet been committed and it should be...
			commitIfReady();
		}
	}
	
	/**
	 * Deregisters the transaction from the current thread but leaves it open, returns the current transaction if any
	 */
	public static Transaction suspendTransaction() {
		Transaction txn = transactions.get();
		//System.out.println("suspending transaction: " + txn.toString());
		transactions.set(new ImmediateTransaction());
		return txn;
	}
	
	public static void exitTransaction() {
		Transaction txn = transactions.get();
		if(txn.client!=null){
			synchronized(txn.client){
				txn.leaveTransaction();
			}
		}else{
			txn.leaveTransaction();
		}
		transactions.set(new ImmediateTransaction());
	}
	/**
	 * Get the current transaction for this thread
	 * @return
	 */
	public static Transaction currentTransaction() {
		Transaction current = transactions.get();
		if (current == null){
			transactions.set(current = new ImmediateTransaction());
		}
		return current;
	}
	public Date getTransactionTime() {
		return new Date(transactionTime);
	}
	/**
	 * Adds a call to the list of observed calls that need to be fired to listeners
	 * @param target
	 * @param methodName
	 * @param content
	 * @param supersedes
	 */
    void addObservedCall(ObjectId targetId, String methodName,Object content,boolean supersedes, boolean clientInitiatedCall) {// TODO: Probably should move this to Transaction
    	Map<PropertyChangeSetListener,List<ObservedCall>> observedCallSet = getObservedCallSet();
    	IndividualRequest request = Client.getCurrentObjectResponse();
    	// create an observed call 
    	ObservedCall evt = new ObservedCall(targetId, methodName, methodName.equals("DELETE") ? org.mozilla.javascript.Undefined.instance : content,
    			// if it is a clientInitiatedCall, we record the connection so we can avoid sending the notification back to the client 
    			request != null && clientInitiatedCall && !request.performedClientInitiatedCall ? request.getConnection() : null);
    	// iterate through all the listeners
    	synchronized(PersistableObject.watchSets){
    		Scriptable global = GlobalData.getGlobalScope();
	    	for (Entry<PropertyChangeSetListener,Map<ObjectId, Set<String>>> entry : PersistableObject.watchSets.entrySet()) {
	    		PropertyChangeSetListener listener = entry.getKey();
	    		Map<ObjectId, Set<String>> idMap = entry.getValue();
	    		ObjectId objId = targetId;
	    		// iterate up the parent chain
	    		do {
	    			Set<String> propertySet = idMap.get(objId);
	    			// check to see if this listener is watching the given object and property
		    		if (propertySet != null && propertySet.contains(methodName)) {
		    			boolean reallyMatches = false;
		    			// Queries with conditions are treated as equal, we need to see if it really matches
		    			for(ObjectId watchedId : idMap.keySet()){
		    				if(watchedId.equals(objId)){
		    					if(watchedId instanceof Query && ((Query)watchedId).conditionFunction != null){
		    						reallyMatches = ScriptRuntime.toBoolean(((Query)watchedId).conditionFunction.call(PersevereContextFactory.getContext(), global, global, new Object[]{
		    							content
		    						}));
		    						if(!reallyMatches){
		    							transactions.set(OUTSIDE);
		    							try{
				    						reallyMatches = ScriptRuntime.toBoolean(((Query)watchedId).conditionFunction.call(PersevereContextFactory.getContext(), global, global, new Object[]{
				    							content
				    						}));
		    							}
		    							finally{
		    								transactions.set(this);
		    							}
		    						}
		    					}
		    					else
		    						reallyMatches = true;
		    				}
		    			}
		    			if(reallyMatches){
			    			List<ObservedCall> changeEvents;
			    			// get or make the array of change events
			    			if (observedCallSet.containsKey(listener))
			    				changeEvents = observedCallSet.get(listener);
			    			else
			    				observedCallSet.put(listener,changeEvents = new ArrayList<ObservedCall>());
			    			if (supersedes) {
			    				//TODO: Check to see if there are any previous events that this supersedes
			    			}
			    			changeEvents.add(evt);
			    			break;
		    			}
		    			//TODO: Must stop at a lazy loaded property reference
		    		}
		    		methodName = ""; // must be a fullset if it is the parent
	    		} while ((objId = getParentId(objId))!=null);
	    	}
    	}
    }
    private static ObjectId getParentId(ObjectId objId){
    	try{
    		Persistable parent = (objId instanceof Query ? ((Query)objId).getCachedTarget() : objId.getTarget()).getParent();
    		return parent == null ? null : parent.getId();
    	} catch(ObjectNotFoundException e){
    		return ObjectId.idForObject(objId.source, "");
    	}
    }
    public void commitIfImmediate(){
    	// do nothing for normal transaction
    }
    public static class ImmediateTransaction extends Transaction {
        public void commitIfImmediate(){
			synchronized(this){
				this.transactionTime = 0;
				this.writerSet.clear();
				commit();
			}
        }
    	
    }
}
