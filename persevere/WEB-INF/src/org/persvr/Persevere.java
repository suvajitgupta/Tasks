package org.persvr;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import org.apache.commons.logging.LogFactory;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.PersistableClass;
import org.persvr.data.PersistableObject;
import org.persvr.data.Transaction;
import org.persvr.datasource.DataSource;
import org.persvr.javascript.PersevereContextFactory;
import org.persvr.security.PermissionLevel;
import org.persvr.security.SystemPermission;
import org.persvr.security.UserSecurity;
/**
 * This is the main API for accessing Persevere's data (from Java).  
 * @author Kris
 *
 */
public class Persevere {
	
	private static Properties properties = new Properties();
	static {
		try {
			InputStream is = Persevere.class.getResourceAsStream("/org/persvr/persevere.properties");
			
			if (is != null) {
			   properties.load(is);	
			}
			else {
     		   LogFactory.getLog(Persevere.class.toString()).info("Unable to load persevere.properties file");	
			}				
		}
		catch (IOException e) {
			LogFactory.getLog(Persevere.class.toString()).info("Unable to load persevere.properties file");	
		}
	}	
		
	private static String getProperty(String property) {			
		return properties.getProperty(property);
	}	
	
	/**
	 * The creates a new JavaScript object. It will be persisted if it 
	 * is ever added as a property value to another persisted object. 
	 * @return the new persistable JavaScript object
	 */
	public static PersistableObject newObject() {
		PersistableObject result = new PersistableObject();
        ScriptRuntime.setObjectProtoAndParent((ScriptableObject) result, GlobalData.getGlobalScope());
        return result;
	}
	/**
	 * This creates a new instance object from a Persevere class. This will be automatically 
	 * persisted in the class's table (when the current transaction is committed). 
	 * @param className  The name of the class from which to instantiate. 
	 * @return the newly created instance object
	 */
	public static Persistable newObject(String className) {
		DataSource source = DataSourceManager.getSource(className);
		if(source == null)
			throw new RuntimeException("The table " + className + " was not found");
		Persistable object = newObject(source);
		((PersistableClass)object.getSchema()).doConstruction(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), object, new Object[]{});
		return object;
	}
	/**
	 * This creates a new instance object for the given query/table. This will be automatically 
	 * persisted in the class's table (when the current transaction is committed). 
	 * @param queryId The id of the table 
	 * @return the newly created instance object
	 */
	public static Persistable newObject(ObjectId queryId) {
		Persistable object = newObject(queryId.source);
		((PersistableClass)object.getSchema()).doConstruction(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), object, new Object[]{});
		return object;
	}
	/**
	 * This may be removed in the future
	 * @param source
	 * @return
	 */
	@Deprecated
	public static PersistableObject newObject(DataSource source) {
		if(PersistableObject.isSecurityEnabled()){
			PersistableObject.checkSecurity(ObjectId.idForObject(source, "").getTarget(), PermissionLevel.APPEND_LEVEL.level);
		}
		
		PersistableObject result = PersistableObject.initObject(source);
		result.onCreation();
        Transaction.currentTransaction().addNewItem(result);
        return result;	
	}
	/**
	 * The creates a new JavaScript array. It will be persisted if it 
	 * is ever added as a property value to another persisted object. 
	 * @return the new persistable JavaScript array
	 */
	public static PersistableArray newArray() {
		PersistableArray result = new PersistableArray(0);
        ScriptRuntime.setObjectProtoAndParent((ScriptableObject) result, GlobalData.getGlobalScope());
        return result;
	}
	/**
	 * This creates a new instance array for the given query/table. This will be automatically 
	 * persisted in the class's table (when the current transaction is committed). 
	 * @param queryId The id of the table 
	 * @return the newly created instance object
	 */
	public static PersistableArray newArray(ObjectId parentId) {
		return newArray(parentId.source);
	}
	public static PersistableArray newArray(DataSource source) {
		if(PersistableObject.isSecurityEnabled()){
			PersistableObject.checkSecurity(ObjectId.idForObject(source, "").getTarget(), PermissionLevel.APPEND_LEVEL.level);
		}
		PersistableArray result = PersistableObject.initArray(source);
        Transaction.currentTransaction().addNewItem(result);
        return (PersistableArray) result;	
	}
	/**
	 * This loads an object by id, or executes a query. This acts like a RESTful GET
	 * URL, with <a href="http://sites.google.com/site/persvr/documentation/jsonquery">full 
	 * JSONQuery capabilities</a>. Returning an object if an object id is provided, returning 
	 * a result set if a query is provided, and returning a value if a path is provided. For example:
	 * <pre>
	 * load("MyClass/4") -> returns the instance of MyClass with an id of 4
	 * load("MyClass/?foo='bar'") -> executes a query, returning all the instances of MyClass with a property foo equal to "bar"
	 * load("MyClass/4.foo") -> returns the value of the property foo for the given instance
	 * </pre>
	 *    
	 * @param query  the object id or query to execute
	 * @return
	 */
	public static Object load(String query) {
		return Identification.idForString(query).getTarget();
	}
	public static void createNewTable(String name, String superType) {
		if(!UserSecurity.hasPermission(SystemPermission.createTables)){
			throw new SecurityException("You do not have permission to create new tables");
		}
		if (name.matches("[^\\w$_]"))
			throw new RuntimeException("Illegal character in table");
		Persistable newSource = Persevere.newObject(DataSourceManager.getMetaClassSource());
		newSource.set("id", name);
		newSource.set("extends", superType instanceof String ? ObjectId.idForObject(DataSourceManager.getMetaClassSource(), superType) : ObjectId.idForObject(DataSourceManager.getMetaClassSource(),"Object"));

	}
	/**
	 * Returns the current version of Persevere
	 * @return
	 */
	public static String getPersevereVersion(){
		
		return Persevere.getProperty("version");
	}
	
	
	
	
	
	
}
