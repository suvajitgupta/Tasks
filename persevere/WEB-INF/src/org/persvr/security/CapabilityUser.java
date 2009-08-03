/*
 * User.java
 *
 * Created on July 5, 2005, 10:58 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.security;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.PrivilegedAction;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.WeakHashMap;

import javax.security.auth.login.LoginException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.binary.Base64;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.persvr.Persevere;
import org.persvr.data.DataSourceManager;
import org.persvr.data.GlobalData;
import org.persvr.data.JsonPath;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableArray;
import org.persvr.data.PersistableList;
import org.persvr.data.PersistableObject;
import org.persvr.data.PersistableClass;
import org.persvr.data.Transaction;
import org.persvr.remote.Client;
/**
 *
 * There are three states of a user:
 * 1. anonymous private - user is maintained across sessions through cookies and can be converted to a real user by establishing a username and password.  This is the default state.
 * 2. shared public - multiple users are using this computer so a user is not maintained across sessions
 * 3. authenticated - either one or two can convert to this, but if a user already exists, it must do a merge of data
 */
public class CapabilityUser extends PersistableObject implements User {
/*    public PermissionLevel getPermissionLevel(Persistable obj) {
    	if (supervisorGroup.isMember(this)) // TODO: we need a faster way to do this
    		return PermissionLevel.WRITE_LEVEL;
    	Acl acl = obj.getAcl();
        Enumeration<Permission> permissions = acl.getPermissions(this);
        while (permissions.hasMoreElements()) {
        	Permission perm = permissions.nextElement();
        	if (perm instanceof PermissionLevel)
        		return (PermissionLevel) perm;
        }
        return PermissionLevel.NONE_LEVEL;

	}


	public boolean hasPermission(Permission permision) {
		return getSupervisorGroup().isMember(this);
	}*/
	public static final String PASSWORD_FIELD = ":password";
	public static final String IN_GROUPS_FIELD = ":inGroups";
	public static final String USER_DATA_FIELD = "userData";
	public static final String PUBLIC_USER_NAME="_public_";
    //TODO: make this not public!
    public Map<Persistable,PermissionLevel> computedPermissions = new WeakHashMap();
    boolean isSharedPublic = false;
    private static CapabilityUser publicUserObject;  

    static java.security.acl.Group supervisorGroup;
    public static void resetSecurity() {
    	/*
    	UserSecurity.doPriviledgedAction(new PrivilegedAction() {

			public Object run() {
/*				Object securitySettingsObject = DataSourceManager.getRootObject().get("securitySettings");
				Object supervisorGroupObject = ScriptableObject.NOT_FOUND;
				if (securitySettingsObject instanceof Persistable) {	
			    	securitySettings = (Persistable) securitySettingsObject;
				}
				else {
					DataSourceManager.getRootObject().set("securitySettings",new NativeObject());
					securitySettingsObject = DataSourceManager.getRootObject().get("securitySettings");
			    	securitySettings = (Persistable) securitySettingsObject;
				}
					//publicUserObject = (Persistable) getSecuritySettings().get("anonymousUser");
		    	supervisorGroupObject = getSecuritySettings().get("supervisor");
				Persistable groups = ObjectId.idForString("Group").getTarget();
				Object supervisorGroupObject = groups.get("supervisor"); 
		    	if (supervisorGroupObject==ScriptableObject.NOT_FOUND)
		    		supervisorGroup = new Anyone();
		    	else
		    		supervisorGroup = (java.security.acl.Group) supervisorGroupObject;
		    	return null;
			}
    		
    	});
    	*/
    }
    static boolean unrestrictedMode;
    public static CapabilityUser PUBLIC_USER;
    static {
/*    	int numUsers = usersTable().size();
		if (numUsers == 0) { //first real user
			PUBLIC_USER = (CapabilityUser) Persevere.newObject("User");
			PUBLIC_USER.setUsername("public");
			unrestrictedMode = true;
		}
		else {
			if (numUsers == 1)
				unrestrictedMode = true;
			PUBLIC_USER = (CapabilityUser) usersTable().get(0);
		}*/
    }
/*
    	// must set this temporarily while we are starting so that there is a supervisor group
    	supervisorGroup = new java.security.acl.Group() { 
    		public boolean addMember(Principal user) {
    			return false;
    		}
    		public boolean isMember(Principal member) {
    			return false;
    		}
    		public Enumeration<? extends Principal> members() {
    			return null;
    		}
    		public boolean removeMember(Principal user) {
    			return false;
    		}
    		public String getName() {
    			return "No one";
    		}
    	};
    	resetSecurity();
    }*/
    long id;
	public void onCreation() {
		super.onCreation();
		if (unrestrictedMode) { //first real user
			Object writeable = noCheckGet("full");
			if (!(writeable instanceof PersistableArray)) {
				writeable = Persevere.newArray();
				set("full",writeable);
			}
			((PersistableArray) writeable).add(DataSourceManager.getRootObject());
		}
		unrestrictedMode = false;
//		setupNewUser(true);
	}

/*    public AclUser(final String username, final String password) {
        //id = getNewId();
    	//findUser("" + id);
    	UserSecurity.doPriviledgedAction(new PrivilegedAction() {

			public Object run() {
				validateUsername(username);
				setupNewUser(true);
				setUsername(username);
				setPassword(password);
				Transaction.currentTransaction().commit();
				return null;
			}
    	});
    }*/

    public CapabilityUser() {
    }
    private CapabilityUser(boolean isShared) {
    	this.isSharedPublic = isShared;
    }

    public static java.security.acl.Group getSupervisorGroup() {
    	return (java.security.acl.Group) supervisorGroup;
    	
    }
    private CapabilityUser findUser(String id) {
        List correctUsers = (List) JsonPath.query(usersTable(),"[?(@.userid=$1)]",id); 
        	//PersistentList.filter(usersTable(),new SimpleStipulation(USER_Id_FIELD,"" + id));
        //System.err.println("correctUsers = " + correctUsers.isEmpty());
        if (correctUsers.isEmpty())
        	return publicUserObject;
        else
        	return (CapabilityUser) correctUsers.get(0);
    }
 /*   private void setupNewUser(final boolean realUser) {
    	
		        //usersTable().add(AclUser.this);
		        boolean registerAsNewUser = true;
//		        userObject = (Persistable) usersTable().get(usersTable().size()-1);
		    	if (realUser) {
			        //calculateMembership(userObject, usersTable());
			      //  userObject.put(USER_Id_FIELD, id);
			        //if (usersTable().get(GlobalData.PERMISSION_FIELD) instanceof DataSourceObject)
			           // userObject.put(GlobalData.PERMISSION_FIELD, usersTable().get(GlobalData.PERMISSION_FIELD));
		    		Persistable groups = ObjectId.idForString("Group").getTarget();
			        if (Scriptable.NOT_FOUND== groups.get("supervisor")) {
			        	supervisorGroup = (Group) PersevereRuntime.newObject("Group");
//			        	((Persistable) supervisorGroup).set(GlobalData.BASIS_FIELD, Templates.getBasisForClass(Group.class));
			        	groups.set("supervisor",supervisorGroup);
			        	getSupervisorGroup().addMember(CapabilityUser.this);
			        	registerAsNewUser = true;
			        	
			            //calculateMembership(User.this, getSupervisorGroup());
			        	//getSecuritySettings().delete("nextCreatedUserIsSupervisor");
			        }
		    	}
		        
		        //PersevereRuntime.newObject(DataSourceManager.getSource("User"));
		        Persistable userData = (Persistable) set(USER_DATA_FIELD, PersevereRuntime.newArray());
		        List security =(List) userData.set(ACCESS_FIELD, PersevereRuntime.newArray());
		        //((Persistable) security).set("name", getName() + "'s");
		        //DataObjectList list = (DataObjectList) security.put(ROLE_PERMITS_FIELD, new TransientDataObjectList());
		        Persistable rolePermit = PersevereRuntime.newObject();
		        //TODO: Change this to get the permit by level number
//		        Object writeLevel = ((List) JsonPath.query((Persistable) securitySettings.get("permissionLevelTypes"),"$[?(@.name='write')]")).get(0);
		        rolePermit.set(PERMISSION_LEVEL_FIELD, "write");
		       /* rolePermit.put(VERSION_FIELD, Boolean.TRUE);
		        rolePermit.put(APPEND_FIELD, Boolean.TRUE);
		        rolePermit.put(READ_FIELD, Boolean.TRUE);
		        rolePermit.put(WRITE_FIELD, Boolean.TRUE);
		        rolePermit.set(ROLE_FIELD, CapabilityUser.this);
		        security.add(rolePermit);

    }*/

    static long getNewId() {
        // TODO: we need to do something ensure that this does not return a value that had been used before, it is also more efficient if it is hex format
        return (new Random()).nextLong();
    }
    @Deprecated
    public static CapabilityUser publicUser() {
        return PUBLIC_USER; 
    }
/*    DataObject getUserObject() {
        DataObjectList correctUsers = (DataObjectList) usersTable.get(new SimpleStipulation("userid","" + id));
        if (correctUsers.size() == 0) {
            throw new LoginException("operating on a user with no valid entry in the database");
        }
        return (DataObject) correctUsers.get(0);
    }*/
    /*User(Persistable userObject ) {
    	addActiveUser();
        this.userObject = userObject;
        //id = Long.parseLong((String) userObject.get(USER_Id_FIELD));
        if (userObject.get("name") instanceof String)
            username = (String) userObject.get("name");
      //  else
        //    username = "" + id;
    }*/
    String currentTicket;
    public String getCurrentTicket() {
    	return currentTicket;
    }
    public static CapabilityUser getUserByTicket(String id,String ipAddress) throws LoginException {
        if (PUBLIC_USER_NAME.equals(id))
            return publicUser();
    	final String ticket = id + ipAddress;
    	Object userObject = UserSecurity.doPriviledgedAction(new PrivilegedAction() {
    		public Object run() {
    			Object userTickets = DataSourceManager.getRootObject().get("userTickets");
    			if (!(userTickets instanceof Persistable)) {
    				userTickets = Persevere.newObject();
    				DataSourceManager.getRootObject().set("userTickets",userTickets);
    			}
    					
				return ((Persistable) userTickets).get(ticket);
			}		 
    	});
    	
    	if (userObject instanceof CapabilityUser) {
    		return (CapabilityUser) userObject;
    	}
    	else 
    		throw new LoginException("The user ticket is no longer valid");
    }
    @Deprecated
    public String getNewTicket(String ipAddress) {
    	String ticket = ipAddress + new Date().getTime() + "" + new Random().nextInt();
    	((Persistable) DataSourceManager.getRootObject().get("userTickets")).set(ticket,this);
    	return ticket;
    }
    static CapabilityUser getUserByUsername(String username) {
    	if (username.equals(UserSecurity.getUserName()))
    		return (CapabilityUser) UserSecurity.currentUser();
        List correctUsers = (List) JsonPath.query(usersTable(),"$[?(@.name=$1)]", username);
        if (correctUsers.size() == 0) {
            throw new RuntimeException("user " + username + " not found");
        }
    	return (CapabilityUser) ((Persistable) correctUsers.get(0));
    		
    }
    /* merge the data into our data */
    void mergeUserData(CapabilityUser user) {
        //TODO: Implement this
    //    userObject.putAll(user.userObject);
      //  userObject.put("name",username);
    }
    public static CapabilityUser authenticate(final String username,final String password) throws LoginException {
    	Object result = UserSecurity.doPriviledgedAction(new PrivilegedAction() {
    		public Object run() {
    			List correctUsers = (List) JsonPath.query(usersTable(),"$[?(@.name=$1)]", username);
    	        if (correctUsers.size() == 0) {
    	            return new LoginException("user " + username + " not found");
    	        }
    	        Persistable userObject = (Persistable) correctUsers.get(0);
    	        boolean alreadyHashed = false;
    	        boolean passwordMatch = password.equals(userObject.get(PASSWORD_FIELD));
    	        if (!passwordMatch) {
    	            try {
    				MessageDigest md = MessageDigest.getInstance("SHA");
    				md.update(((String) userObject.get(PASSWORD_FIELD)).getBytes());
    				passwordMatch = password.equals(new String(new Base64().encode(md.digest())));
    				} catch (NoSuchAlgorithmException e) {
    					throw new RuntimeException(e);
    				}
    				alreadyHashed = true;        	
    	        }
    	        if (passwordMatch) {
    	            //Logger.getLogger(CapabilityUser.class.toString()).info("User " + username + " has been authenticated");
    	            CapabilityUser user = (CapabilityUser) userObject;
    	            try {
    	            	if (alreadyHashed)
    	            		user.currentTicket = password;
    	            	else {
    						MessageDigest md = MessageDigest.getInstance("SHA");
    						md.update(password.getBytes());
    						user.currentTicket = new String(new Base64().encode(md.digest()));
    	            	}
    				} catch (NoSuchAlgorithmException e) {
    					throw new RuntimeException(e);
    				}
    	            return user;
    	        }
    	        else {
    	            //Logger.getLogger(CapabilityUser.class.toString()).info("The password was incorrect for " + username);
    	            return new LoginException("The password was incorrect for user " + username + ". ");
    	        }
    			
    		}
    	});
    	if (result instanceof LoginException)
    		throw (LoginException) result;
    	return (CapabilityUser) result;
    }
/*    public User reAuthenticate(String username,String password) throws LoginException{
        User user = authenticate(username,password);
        if (getName() == null)  // merge the current data only if he is not another named user
            user.mergeUserData(this);
        return user;
    }*/
    static boolean hostSpecificSecurity = false;
    protected static Persistable usersTable() {
    	return (Persistable) ObjectId.idForString("User/").getTarget();
//    	if (hostSpecificSecurity)
    }
    //private String username = null;
   // private Persistable userObject = null;
//    private String password = null;
/*    public Persistable getUserObject() {
    	return userObject;
    }*/
    public void logout() {
      //  username = null;
    }
    public String getName() {
    	Object nameObject = get("name");
    	if (nameObject instanceof String)
    		return (String) nameObject;
    	return null;
    }
    public String getPassword() {
    	return (String) get(PASSWORD_FIELD);
    }
    public static final Persistable PRIVILEDGED_USER_OBJECT = Persevere.newObject();
    public static final String EVERYONE = "everyone";
    public static final Object SUPER_ROLE = new Object();
    /*public boolean isUserInRole(final Object role) {
        // TODO: Put this in the same package as AbstractWrapper so we can go through to the inner data to do this check
/*        while (role instanceof DataObject && !(role instanceof DataSourceObject)) {
            role = ((AbstractWrapper) role).data();
        }
        //System.err.println("testisUserInRole " + role + " userObject " + userObject + " == " + (role == userObject));
        if (role == userObject)
            return true;
        if (role.equals(EVERYONE))
            return true;
        if (userObject == null)
            return false;
        if (role.equals("authenticated"))
            return true; // TODO: I would like to get rid of these two for optimization
        if (userObject.equals(PRIVILEDGED_USER_OBJECT))
        	return true;
/*        if (username != null && username.equals(role)) // Your user name counts as a role
            return true; 
        //Object userInfo = userObject.get(USER_INFO_FIELD);
        if (role instanceof Persistable) {
            // assuming it is a group now
        	return Boolean.TRUE.equals(doPriviledgedAction(new PrivilegedAction<Boolean>() {

    			public Boolean run() {

    				List roleMatch = PersistentList.filter((List) userObject.get(IN_GROUPS_FIELD),new IsStipulation(role));
    	            return !roleMatch.isEmpty();
    			}
    		}));
/*            Object users = ((DataObject) role).get(USERS_FIELD);
            if (users instanceof DataObjectList)
                return !((DataObjectList) users).get(new IsStipulation(userObject)).isEmpty();
            else
                System.err.println("specified role is not a group " + role); */
        //}
/*        if (userInfo instanceof DataObject)
            return (((DataObjectList) ((DataObject) userInfo).get("groups")).get(new SimpleStipulation("name", role)).size() > 0);
        return false;
    }*/
    public void setUsername(String username) {
    	List correctUsers = (List) JsonPath.query(usersTable(),"$[?(@.name=$1)]", username);
    	if (correctUsers.size() == 0) {
            set("name",username);
            //this.username = username;
        }
        else
            throw new RuntimeException("The username " + username + " is already taken");
    }
    /* login as a different user, must be in the su capable group */
    public CapabilityUser su(String username) {
        if (!getSupervisorGroup().isMember(this))
            throw new RuntimeException("You are not a part of the su capable group, so you can not su");
        List correctUsers = (List) JsonPath.query(usersTable(),"$[?(@.name=$1)]", username);
        if (correctUsers.size() == 0) {
            throw new RuntimeException("user " + username + " not found");
        }
        Persistable userObject = (Persistable) correctUsers.get(0);
        return (CapabilityUser) userObject;
    }
    public void setPassword(String password) {
        //Logger.getLogger(CapabilityUser.class.toString()).info("now changing the password for " + getName());
        set(PASSWORD_FIELD,password);
        setAttributes(PASSWORD_FIELD, ScriptableObject.DONTENUM);
    }
    static String encrypt(String plaintext)
    {
         MessageDigest d =null;
         try {
         d = MessageDigest.getInstance("SHA-1");
         //d.reset();
         d.update(plaintext.getBytes("UTF-8"));
         }
         catch(Exception e) {
             e.printStackTrace();
         }
         return new String(Base64.encodeBase64(d.digest()));
    }
    private static boolean oneWayCompare(Collection c1, Collection c2)
    {
    	for (Object obj : c1)
    		if (!c2.contains(obj))
    			return false;
    	return true;
    }
    private static boolean compare(Collection c1, Collection c2) {
    	return oneWayCompare(c1, c2) && oneWayCompare(c2, c1); 
    }
    public static Set<Persistable> calculateMembership(Persistable member, List groupToConsider) {
    	//Logger.getLogger(CapabilityUser.class.toString()).info("calculating membership");
    	Set newInGroups = new HashSet();
    	Set<List>groupsToConsider = new HashSet();
    	if (groupToConsider != null)
    		groupsToConsider.add(groupToConsider);
    	try {
    		groupsToConsider.addAll((List) member.get(IN_GROUPS_FIELD));
    	}
    	catch (ClassCastException e) {
    	}
    	try {
	    	for (List group : groupsToConsider) {
	    		if (group.contains(member)) { // verify membership
	    			newInGroups.addAll(calculateMembership((Persistable) group,null));
	    		}
	    	}
    	}
    	catch (ClassCastException e) {
    		e.printStackTrace();
    	}
    	
    	Object oldInGroups = member.get(IN_GROUPS_FIELD);
    	if (!(oldInGroups instanceof List) ||  !compare((List) oldInGroups,newInGroups)) {
    		NativeArray newInGroupsObject = Persevere.newArray();
    		//for (Object obj : newInGroups)
    			//newInGroupsObject.add(obj);
    		member.set(IN_GROUPS_FIELD, newInGroupsObject);
    		for (Persistable subMember : (List<Persistable>) member)
    			calculateMembership(subMember, (List) member);
    	}
    	newInGroups.add(member);  // we return a list of all membership, so I should be included
    	resetComputedPermissions();
    	return newInGroups;
    }


    public int compareTo(Object o) {
        return new Integer(hashCode()).compareTo(new Integer(o.hashCode()));
    }
    
	private static PersistableObject getOrCreatePersistentObject(Persistable object, String name) {
		Object value = object.get(name);
		if (!(value instanceof PersistableObject)) {
			value = Persevere.newObject();
			object.put(name, object, value);
		}
		return (PersistableObject) value;
	}
	private static PersistableArray getOrCreatePersistentList(Persistable object, String name) {
		Object value = object.get(name);
		if (!(value instanceof PersistableArray)) {
			value = Persevere.newArray();
			object.put(name, object, value);
		}
		return (PersistableArray) value;
	}

	public static boolean isHostSpecificSecurity() {
		return hostSpecificSecurity;
	}

	public static void setHostSpecificSecurity(boolean websiteSpecificSecurity) {
		CapabilityUser.hostSpecificSecurity = websiteSpecificSecurity;
	}

}
