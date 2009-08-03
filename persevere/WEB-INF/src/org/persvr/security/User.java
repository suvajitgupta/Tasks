package org.persvr.security;

import java.security.Principal;

/**
 * This represents a user in the Persevere system
 * @author Kris
 *
 */
public interface User extends Principal {
	
	/**
	 * Allows a user to return ticket so that the password does not need to be stored for reauthentication
	 * This may be moved to a separate interface
	 * @return ticket
	 */
	public String getCurrentTicket();
}
