package org.persvr.security;

import java.security.Principal;
import java.security.acl.Acl;
import java.security.acl.AclEntry;
import java.security.acl.LastOwnerException;
import java.security.acl.NotOwnerException;
import java.security.acl.Permission;
import java.util.Enumeration;

public abstract class SystemAcls implements Acl {
	private SystemAcls() {		
	}
	public final static Acl IMMUTABLE_ACL = new SystemAcls() {

		public boolean checkPermission(Principal principal, Permission permission) {
			return permission == PermissionLevel.LIMITED_LEVEL || permission == PermissionLevel.READ_LEVEL;
		}

		public String getName() {
			return "READONLY";
		}

		public Enumeration<Permission> getPermissions(Principal user) {
			return new Enumeration<Permission>() {
				boolean returnedPermission = false;
				public boolean hasMoreElements() {
					return !returnedPermission;
				}

				public Permission nextElement() {
					returnedPermission = true;
					return PermissionLevel.READ_LEVEL;
				}
				
			};
		}
	};
	public final static Acl DEFAULT_ACL = new SystemAcls() {

		public boolean checkPermission(Principal principal, Permission permission) {
			return permission == PermissionLevel.LIMITED_LEVEL || permission == PermissionLevel.READ_LEVEL 
					|| CapabilityUser.getSupervisorGroup().isMember(principal);
		}

		public String getName() {
			return "DEFAULT";
		}

		public Enumeration<Permission> getPermissions(final Principal user) {
			return new Enumeration<Permission>() {
				boolean returnedPermission = false;
				public boolean hasMoreElements() {
					return !returnedPermission;
				}

				public Permission nextElement() {
					returnedPermission = true;
					if (CapabilityUser.getSupervisorGroup().isMember(user))
						return PermissionLevel.WRITE_LEVEL;
					else
						return PermissionLevel.READ_LEVEL;
				}
				
			};
		}
	};
	public final static Acl FULL_PUBLIC_ACCESS_ACL = new SystemAcls() {

		public boolean checkPermission(Principal principal, Permission permission) {
			return true;
		}

		public String getName() {
			return "FULL_PUBLIC_ACCESS_ACL";
		}

		public Enumeration<Permission> getPermissions(final Principal user) {
			return new Enumeration<Permission>() {
				boolean returnedPermission = false;
				public boolean hasMoreElements() {
					return !returnedPermission;
				}

				public Permission nextElement() {
					returnedPermission = true;
					return PermissionLevel.WRITE_LEVEL;
				}
			};
		}
	};
	public boolean addEntry(Principal caller, AclEntry entry) throws NotOwnerException {
		throw new UnsupportedOperationException();
	}


	public Enumeration<AclEntry> entries() {
		throw new UnsupportedOperationException();
	}
	public boolean removeEntry(Principal caller, AclEntry entry) throws NotOwnerException {
		throw new UnsupportedOperationException();
	}

	public void setName(Principal caller, String name) throws NotOwnerException {
		throw new UnsupportedOperationException();
	}

	public boolean addOwner(Principal caller, Principal owner) throws NotOwnerException {
		throw new UnsupportedOperationException();
	}

	public boolean deleteOwner(Principal caller, Principal owner) throws NotOwnerException, LastOwnerException {
		throw new UnsupportedOperationException();
	}

	public boolean isOwner(Principal owner) {
		return false;
	}
	
	

}
