package org.persvr.security;

import java.security.PrivilegedAction;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;

import javax.security.auth.login.LoginException;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.persvr.Persevere;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.PersistableList;
import org.persvr.data.PersistableObject;
import org.persvr.data.Query;
import org.persvr.data.Transaction;
import org.persvr.javascript.PersevereNativeFunction;
import org.persvr.security.UserSecurity.PriviledgedUser;

public class Capability extends PersistableObject{

	public Capability() {
		super();
	}
//	Map<Persistable,Integer> computedPermissions = new WeakHashMap<Persistable, Integer>();// cache of computed permissions
	static Map<Object, Capability[]> userCapabilities = new HashMap<Object, Capability[]>(); 
	Set<Object> getAllMembers(){
		Object members= get("members");
		if (members instanceof List){
			Set allMembers = new HashSet((List) members);
			for(Object member : (List)members){
				if(member instanceof Capability){
					allMembers.remove(member);
					allMembers.addAll(((Capability)member).getAllMembers());
				}
			}
			return allMembers;
		}
		return new HashSet<Object>();
	}
	void addAllUserCapabilities(){
		for(Object member : getAllMembers()){
			addToUserCapabilities(member);
		}
	}
	void addToUserCapabilities(Object member){
		//TODO: Check to make sure it is not already added
		Capability[] oldCapabilities = userCapabilities.get(member);
		int length = oldCapabilities == null ? 0 : oldCapabilities.length;
		Capability[] newCapabilities = new Capability[length+1];
		if(length != 0)
			System.arraycopy(oldCapabilities, 0, newCapabilities, 0, length);
		newCapabilities[length] = this;
		userCapabilities.put(member, newCapabilities);
	}
	void removeFromUserCapabilities(Object member){
		Capability[] capabilities = userCapabilities.get(member);
		List<Capability> capabilityList = new ArrayList();
		for(Capability capability : capabilities){
			if(capability != this)
				capabilityList.add(capability);
		}
		capabilities = new Capability[capabilityList.size()];
		capabilityList.toArray(capabilities);
		userCapabilities.put(member, capabilities);
	}
	
	Map<Identification,Integer> allGranted;
	public static Integer getPermissionLevelForString(String name){
		return permissionNameLevelMap.get(name);
	}
	static Function authenticateHandler = new PersevereNativeFunction(){
		@Override
		public Object call(final Context cx, final Scriptable scope,
				final Scriptable thisObj, Object[] args) {
			final String username = (String) args[0];
			final String password = (String) args[1];
			Object user;
			if (username == null) {
				return null;
			}
			else {
				try {
					user = CapabilityUser.authenticate(username, password);
				} catch (LoginException e) {
					throw ScriptRuntime.constructError("AccessError", "Authentication failed");
				}
			}
			
			return user;
	    }

		public String toString() {
			return "function(username,password,validFor){/*native code*/}";
		}
	};
	private static boolean unrestrictedMode;
	static Capability[] getCapabilitiesForUser(Object user){
		Capability[] capabilities = userCapabilities.get(user);
		// if the user has defined and public capabilities, need to merge them
		if(user != null){
			Capability[] publicCapabilities = userCapabilities.get(null);
			if(capabilities == null || capabilities.length == 0)
				capabilities = publicCapabilities;
			else if(capabilities != null && publicCapabilities != null && publicCapabilities.length != 0){
				Capability[] mergedCapabilities = new Capability[publicCapabilities.length + capabilities.length];
				System.arraycopy(capabilities, 0, mergedCapabilities, 0, capabilities.length);
				System.arraycopy(publicCapabilities, 0, mergedCapabilities, capabilities.length, publicCapabilities.length);
				capabilities = mergedCapabilities;
			}
		}
		return capabilities;
	}
	static Function getAccessLevelHandler = new PersevereNativeFunction(){
		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
			Persistable resource = args.length == 0 ? DataSourceManager.getRootObject() : (Persistable) args[0];
			final Object user = UserSecurity.currentUser();
			if(user == resource || user instanceof PriviledgedUser) // TODO: Put the PrivilidegedUser in the userCapabilities map for better speed
				return 6;
			Capability[] capabilities = getCapabilitiesForUser(user);
			if(capabilities == null){
				if(unrestrictedMode){
					if(user == null || user instanceof PriviledgedUser) { 
					}
					else{
						unrestrictedMode = false;
						UserSecurity.doPriviledgedAction(new PrivilegedAction() {

							public Object run() {
								Transaction currentTransaction = Transaction.suspendTransaction();
								// create the first real capability
								Persistable capability = Persevere.newObject("Capability");
								List members = Persevere.newArray();
								capability.put("members", capability, members);
								members.add(user);
								List fullAccess = Persevere.newArray();
								capability.put("full", capability, fullAccess);
								fullAccess.add(DataSourceManager.getRootObject());
								
								// give the public execute permission on everything
								capability = Persevere.newObject("Capability");
								members = Persevere.newArray();
								capability.put("members", capability, members);
								members.add(null);
								List executeAccess = Persevere.newArray();
								capability.put("execute", capability, executeAccess);
								executeAccess.add(DataSourceManager.getRootObject());
								
								if(currentTransaction!=null) currentTransaction.enterTransaction();
								return null;
							}
						});
					}
					// in both cases they will have full access
					return 6;
				}
				else
					return 0;
			}
			//TODO: reenable caching
			boolean capabilityDescendant = false;
			Integer level = null;
        	for(Capability capability : capabilities){
        		Persistable parent = resource;
		        while(parent != null) {
	        		Integer newLevel = capability.getAllGranted().get(parent.getId());
	        		if(newLevel != null) {
	        			if (level == null || level < newLevel)
	        				level = newLevel;
	        			break;
		        	}
	        		boolean security = PersistableObject.isSecurityEnabled();
	        		
	        		PersistableObject.enableSecurity(false);
	        		try{
	        			parent = parent.getParent();
	        		}
	        		finally{
	        			PersistableObject.enableSecurity(security);
	        		}
		        	if (parent instanceof Capability)
		        		capabilityDescendant = true;
		        	
		        }
		        if (parent == null){
		        	Integer newLevel = capability.getAllGranted().get(DataSourceManager.getRootObject().getId());
	        		if(newLevel != null) {
	        			if (level == null || level < newLevel)
	        				level = newLevel;
	        		}
	        	}
	        }
	        if (level == null){
	        	level = PermissionLevel.EXECUTE_LEVEL.level;
	        }
	        else{
		        if (capabilityDescendant && !UserSecurity.hasPermission(SystemPermission.modifyCapabilities)) // we don't allow Capability descendants to modified, it can only be changed by granting access 
		        	level = Math.min(3,level);
	        }
			return level;
		}
		
	};
	static Function hasAccessLevelHandler = new PersevereNativeFunction(){
		// implemented in JS
		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
			return true;
		}
	};
	static Function hasPermissionHandler = new PersevereNativeFunction(){

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
			return true;
		}
		// implemented in JS
	};
	static Function grantAccessHandler = new PersevereNativeFunction(){
		@Override
		public Object call(final Context cx, final Scriptable scope,
				final Scriptable thisObj, Object[] args) {
			Object target = (String) args[0];
			final Persistable resource = (Persistable) args[1];
			//if(target instanceof String)
		//		CapabilityUser.getUserByUsername((String) target).grantCapability(resource, args.length == 2 ? "full" : (String) args[2]);
			//else 
				if (target instanceof Capability){
				((Capability)target).grantCapability(resource, args.length == 2 ? "full" : (String) args[2]);
			}
			else
				throw new RuntimeException("grantAccess must have a target with a username or an capability object");
			return true;
	    }
		public String toString() {
			return "function(target,resource,accessLevel){/*native code*/}";
		}
	};
	static Function createUserHandler = new PersevereNativeFunction(){
		@Override
		public Object call(final Context cx, final Scriptable scope,
				final Scriptable thisObj, Object[] args) {
			final String username = (String) args[0];
			final String password = (String) args[1];
	    	return (User) UserSecurity.doPriviledgedAction(new PrivilegedAction() {

				public Object run() {

					CapabilityUser user = (CapabilityUser) Persevere.newObject("User");
					user.setUsername(username);
					user.setPassword(password);
					Transaction.currentTransaction().commit();
					return user;
				}
	    	});			
	    }
		public String toString() {
			return "function(username,password){/*native code*/}";
		}
	};
	static Map<String,Integer> permissionNameLevelMap = new LinkedHashMap<String,Integer>(4);
	static {
		permissionNameLevelMap.put("none", 0);
		permissionNameLevelMap.put("limited", 1);
		permissionNameLevelMap.put("read", 2);
		permissionNameLevelMap.put("execute", 3);
		permissionNameLevelMap.put("append", 4);
		permissionNameLevelMap.put("write", 5);
		permissionNameLevelMap.put("full", 6);
	}
	Map<Identification,Integer> getAllGranted() {
		synchronized(this){
			if (allGranted == null) {
				allGranted = new HashMap<Identification,Integer>();
				Object grantee;
				int i = 0;
				for (Entry<String,Integer> entry : permissionNameLevelMap.entrySet()){
					String levelName = entry.getKey();
					Integer level = entry.getValue();
					Object grantedObject = noCheckGet(levelName);
					if (grantedObject instanceof PersistableArray) {
						PersistableArray granted = (PersistableArray) grantedObject;
	
							
						i = 0;
						while((grantee = granted.noCheckGet(i++)) instanceof Persistable){
							allGranted.put(((Persistable) grantee).getId(), level);
						}
					}
				}
			}
		}
		return allGranted;
	}
	
	@Override
	public void put(String name, Scriptable start, Object obj) {
		if (permissionNameLevelMap.containsKey(name) && !creating && !UserSecurity.hasPermission(SystemPermission.modifyCapabilities)) {
			throw new RuntimeException("Can not change the granted property of a capability");
		}
		super.put(name, start, obj);
	}
	public Object set(String name, Object value) {
		if (permissionNameLevelMap.containsKey(name) && !creating && !UserSecurity.hasPermission(SystemPermission.modifyCapabilities)) {
			throw new RuntimeException("Can not change the granted property of a capability");
		}
		return super.set(name, value);		
	}
	public void grantCapability(Capability capability) {
		grantCapability((Persistable) capability);
	}
	public static int WRITE_ACCESS = 5;
	public static int FULL_ACCESS = 6;
	public void grantCapability(Persistable target, final String levelName) {
		
		if(target.getId().source == DataSourceManager.getMetaClassSource() && target.getId() instanceof Query){
			target = DataSourceManager.getRootObject();
		}
		final Persistable persistable = target;
		int level = permissionNameLevelMap.get(levelName);
		if (UserSecurity.getPermissionLevel(persistable) < FULL_ACCESS)
			throw new SecurityException("You do not have permission to grant this authorization to this resource");
		computedPermissions.clear(); // clear the cache first
    	UserSecurity.doPriviledgedAction(new PrivilegedAction() {

			public Object run() {
				for (Entry<String,Integer> permissionEntry : permissionNameLevelMap.entrySet()){
					Object grantedObject = noCheckGet(permissionEntry.getKey());
					if (grantedObject instanceof PersistableList) {
						PersistableList<Persistable> granted = (PersistableList<Persistable>) grantedObject;
						if(permissionEntry.getValue() == 7) {
							// if it is granted, we want to clean out bad entries from the previous version of Persevere
							for (int i = granted.size(); i > 0;){
								i--;
								Object grantee = granted.get(i);
								if (!(grantee instanceof Capability)){
									granted.remove(i);
								}
							}
						}
						if (granted.contains(persistable)){
							if (permissionEntry.getKey().equals(levelName)) {
								// already has the right permission
								return null;
							}
							else {
								granted.remove(persistable);
							}
						}
					}
				}
				Object granted = noCheckGet(levelName);
				if (!(granted instanceof PersistableList)){
					granted = Persevere.newArray();
					set(levelName, granted);
				}
				((PersistableList)granted).add(persistable);
				return null;
			}
    	});			
		
		if (allGranted != null)
			allGranted.put(persistable.getId(), level);
	}
	public void grantCapability(final Persistable persistable) {
		grantCapability(persistable, "full");
	}
	
	private boolean creating = false;
	public void onCreation() {
		creating = true;
		//set("granted",new PersistableArray(0));
		
		creating = false;
	}
	static void delegateToGlobalHandler(Scriptable security, final String name){
		final Scriptable global = GlobalData.getGlobalScope();
		security.put(name, security, new PersevereNativeFunction() {
			@Override
			public Object call(final Context cx, final Scriptable scope,
					final Scriptable thisObj, Object[] args) {
				return ((Function)global.get(name, global)).call(cx, scope, thisObj, args);
		    }
			public String toString() {
				return global.get(name, global).toString();
			}
		});
	}
	public static void setupSecurity() {
		Scriptable global = GlobalData.getGlobalScope();
		ScriptableObject security = new NativeObject();
		global.put("security", global, security);
		
		global.put("createUser", global, createUserHandler);
		delegateToGlobalHandler(security,"createUser");
		global.put("grantAccess", global, grantAccessHandler);
		delegateToGlobalHandler(security,"grantAccess");
		global.put("authenticate", global, authenticateHandler);
		delegateToGlobalHandler(security,"authenticate");
		global.put("getAccessLevel", global, getAccessLevelHandler);
		delegateToGlobalHandler(security,"getAccessLevel");
		global.put("hasAccessLevel", global, hasAccessLevelHandler);
		delegateToGlobalHandler(security,"hasAccessLevel");
		global.put("hasPermission", global, hasPermissionHandler);
		delegateToGlobalHandler(security,"hasPermission");
		security.put("getCapabilities", security, new PersevereNativeFunction() {
			@Override
			public Object call(final Context cx, final Scriptable scope,
					final Scriptable thisObj, Object[] args) {
				Object user;
				if(args.length == 0 || args[0] == Undefined.instance){
					user = UserSecurity.currentUser();
				}else if (args[0] instanceof String){
					user = CapabilityUser.getUserByUsername((String)args[0]);
				}else
					user = args[0];
				Capability[] capabilities = getCapabilitiesForUser(user);
				List capArray = Persevere.newArray();
				if(capabilities != null)
					capArray.addAll(Arrays.asList(capabilities));
				return capArray; 
		    }
			public String toString() {
				return "function(target,resource,accessLevel){/*native code*/}";
			}
		});
		security.put("_refresh", security, new PersevereNativeFunction() {
			@Override
			public Object call(final Context cx, final Scriptable scope,
					final Scriptable thisObj, Object[] args) {
				Capability capability = ((Capability)args[0]);
				capability.allGranted = null;
				capability.computedPermissions.clear();
				Transaction currentTransaction = Transaction.suspendTransaction();
				List<Object> oldMembers = new ArrayList(capability.getAllMembers());
				if(currentTransaction!=null) currentTransaction.enterTransaction();
				List<Object> newMembers = args.length == 1 ? 
						new ArrayList(capability.getAllMembers()) : 
							new ArrayList();
				oldMembers.removeAll(newMembers);
				for (Object member : oldMembers){
					capability.removeFromUserCapabilities(member);
				}
				for (Object member : newMembers){
					capability.addToUserCapabilities(member);
				}
				return true;
		    }
			public String toString() {
				return "function(content, target, property){/*native code*/}";
			}
		});
		security.put("changePassword", security, new PersevereNativeFunction() {
			@Override
			public Object call(final Context cx, final Scriptable scope,
					final Scriptable thisObj, Object[] args) {
				final Object user = UserSecurity.currentUser();
				if(user == null){
					throw new SecurityException("Can not change the user's password, no user is logged in");
				}
				if(!(user instanceof CapabilityUser)){
					throw new SecurityException("Can not change the user's password, the current user is not Persevere defined user");
				}
				((CapabilityUser)user).setPassword(args[0].toString());
				return true;
		    }
			public String toString() {
				return "function(newPassword){/*native code*/}";
			}
		});
		security.setGetterOrSetter("currentUser", 0, new PersevereNativeFunction() {
			@Override
			public Object call(Context cx, Scriptable scope,
					Scriptable thisObj, Object[] args) {
				return UserSecurity.currentUser();
			}
			
		}, false);
		List<Object> capabilities = (List<Object>) ObjectId.idForString("Capability/").getTarget();
		unrestrictedMode = true;
		for(Object capability : capabilities){
			if (capability instanceof Capability)
				for(Object member : ((Capability)capability).getAllMembers()){
					// if there are no members of any capabilities, than security is off
					unrestrictedMode = false;
					((Capability)capability).addToUserCapabilities(member);
				}
		}
	}
	public static void grabSecurityHandlers() {
		Scriptable global = GlobalData.getGlobalScope();
		createUserHandler = (Function) global.get("createUser", global);
		grantAccessHandler = (Function) global.get("grantAccess", global);
		final Function doAuthentication = (Function) global.get("authenticate", global);
		// create a wrapper to record the authenticated user in the current thread
		authenticateHandler = new PersevereNativeFunction(){
			@Override
			public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args) {
				Object user = doAuthentication.call(cx, scope, thisObj, args);
				UserSecurity.registerThisThread(user);
				return user;
			}
			
		};
		global.put("authenticate", global, authenticateHandler);
		
		getAccessLevelHandler = (Function) global.get("getAccessLevel", global);
		hasAccessLevelHandler = (Function) global.get("hasAccessLevel", global);
		hasPermissionHandler = (Function) global.get("hasPermission", global);
	}
}
