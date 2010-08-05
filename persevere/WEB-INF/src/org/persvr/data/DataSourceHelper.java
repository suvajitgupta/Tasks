package org.persvr.data;

import java.util.List;

import org.mozilla.javascript.Undefined;
import org.persvr.datasource.PersistableInitializer;
import org.persvr.datasource.Update;

/**
 * A helper class for data sources. Provides means for extra functionality
 * @author Kris
 *
 */
public class DataSourceHelper {
	private DataSourceHelper() {		
	}
    /**
     * This can be called by data sources to initialize or reinitialize an object without having to wait for an object 
     * request to trigger initialization.
     * @param id
     * @return
     */
    public static PersistableInitializer initializeObject(final ObjectId id) {
    	return PersistableObject.initializeObject(id);
    }
    /**
     * This can be called by data sources to initialize or reinitialize an object without having to wait for an object 
     * request to trigger initialization.
     * @param id
     * @return
     */
    public static PersistableInitializer initializeObject() {
    	return PersistableObject.initializeObject();
    }
	/**
	 * This is called by data sources to indicate that a data change has taken place. The
	 * change can then be delivered through notification system to any listening clients.
	 * @param updates - A list of updates
	 */
	public static void sendUpdates(List<Update> updates){
		Transaction transaction = Transaction.startDataSourceInitiatedTransaction();
		for(Update update : updates){
			if(update.getUpdateType() == Update.UpdateType.New) 
				Transaction.currentTransaction().addObservedCall(
						ObjectId.idForObject(update.getTarget().getSource(), ""), "post", update.getTarget(), false, false);
			else if (update.getUpdateType() == Update.UpdateType.Change){
				Transaction.currentTransaction().addObservedCall(
						update.getTarget(), "put", update.getTarget().getTarget(), false, false);
			}
			else if (update.getUpdateType() == Update.UpdateType.Delete)
				Transaction.currentTransaction().addObservedCall(
						update.getTarget(), "delete", Undefined.instance, false, false);
			
		}
		transaction.commit();
	}

}
