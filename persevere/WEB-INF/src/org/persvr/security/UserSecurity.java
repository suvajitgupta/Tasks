package org.persvr.security;


import java.security.PrivilegedAction;

import javax.security.auth.login.LoginException;

import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.persvr.data.GlobalData;
import org.persvr.data.Persistable;
import org.persvr.javascript.PersevereContextFactory;

public class UserSecurity {
	static ThreadLocal<Object> currentUser = new InheritableThreadLocal<Object>();
	public static Object authenticate(final String username, final String password) throws LoginException {
		Scriptable global = GlobalData.getGlobalScope();
		return Capability.authenticateHandler.call(PersevereContextFactory.getContext(), global, global, new Object[]{username, password});
	}

	public static Object currentUser() {
		return currentUser.get();
	}
	public static String getUserName(Object user) {
		if(user instanceof Scriptable){
			return "" + ((Scriptable)user).get("name", (Scriptable)user);
		}
		return "" + user;
	}
	public static String getUserName() {
		Scriptable global = GlobalData.getGlobalScope();
		return (String) ((Function)global.get("getUserName", global)).call(PersevereContextFactory.getContext(), global, global, new Object[0]);
	}
	public static int getPermissionLevel(Persistable object){
		return ((Number) Capability.getAccessLevelHandler.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), GlobalData.getGlobalScope(), new Object[]{ object })).intValue();
	}
	public static boolean hasPermission(String permission){
		return (Boolean) Capability.hasPermissionHandler.call(PersevereContextFactory.getContext(), GlobalData.getGlobalScope(), GlobalData.getGlobalScope(), new Object[]{permission});
	}
	public static void registerThisThread(Object user) {
		currentUser.set(user);
	}
	public static Object doPriviledgedAction(PrivilegedAction action){
		PriviledgedUser priviledgedUser = new PriviledgedUser(currentUser());
		if (action instanceof PrivilegedActionUserAware)
			((PrivilegedActionUserAware)action).currentUser = currentUser();
		try {
			registerThisThread(priviledgedUser);
			Object result = action.run();
			//Transaction.currentTransaction().commit(); // I don't think we want this, and even if we do, we must resume the prior transaction
			return result;
		}
		finally {
			if (priviledgedUser.realCurrentUser != null)
				registerThisThread(priviledgedUser.realCurrentUser);
		}
	}
	public static class PriviledgedUser extends NativeObject implements User {
		Object realCurrentUser;
		PriviledgedUser(Object currentUser) {
			this.realCurrentUser = currentUser;
		}
		public Object getRealCurrentUser() {
			return realCurrentUser;
		}
		public String getName() {
			if(realCurrentUser == null)
				return null;
			return getUserName(realCurrentUser);
		}
		public int getPermissionLevel(Persistable obj) {
			return PermissionLevel.FULL_LEVEL.level;
		}
		public void grantCapability(Capability capability) {
			// nothing to do, it already has all the capability in the world
		}
		public void grantCapability(Persistable persistable) {
			// nothing to do, it already has all the capability in the world
		}
		public boolean hasPermission(java.security.acl.Permission permision) {
			return true;
		}
		public String getCurrentTicket() {
			return null;
		}
		
	}
	public static abstract class PrivilegedActionUserAware implements PrivilegedAction {
		Object currentUser;
		public Object getCurrentUser() {
			return currentUser;
		}
	}
	static {
		currentUser.set(new PriviledgedUser(null));
	
	}
}
