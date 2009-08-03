package org.persvr.security;



import javax.security.auth.login.LoginException;
/**
 * This provides an interface for defining how security and authentication
 * is handled.
 * @author Kris Zyp
 *
 */
public interface SecurityHandler {
	/**
	 * This gets the public user. People that connect to the system without a login will be using this user.
	 * @return
	 */
	public User getPublicUser();
	/**
	 * This performs authentication and returns the authenticated User
	 * @param username
	 * @param password
	 * @return
	 * @throws LoginException
	 */
	public User authenticate(final String username, final String password) throws LoginException;

	/**
	 * Creates a new user in the system
	 * @param username
	 * @param password
	 * @return the newly created user
	 */
	public User createUser(String username, String password);

}
