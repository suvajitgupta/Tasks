package org.persvr.security;

import java.security.PrivilegedAction;

import javax.security.auth.login.LoginException;

import org.persvr.Persevere;
import org.persvr.data.Transaction;

/**
 * This is a default implementation of security. It is uses a standard mechanism ACLs, users, and groups
 * to enforce security and grant access to resources for users 
 * @author Kris
 *
 */
public class DefaultSecurity implements SecurityHandler {
	public User authenticate(String username, String password)
			throws LoginException {
		return CapabilityUser.authenticate(username, password);
	}
	public java.security.acl.Group getSupervisorGroup() {
		return CapabilityUser.getSupervisorGroup();
	}
	public User getPublicUser() {
		return CapabilityUser.PUBLIC_USER;
	}
	public User createUser(final String username, final String password) {
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
}
