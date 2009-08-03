/*
 * SecurityException.java
 *
 * Created on July 4, 2005, 11:17 PM
 *
 * To change this basis, choose Tools | Options and locate the basis under
 * the Source Creation and Management node. Right-click the basis and choose
 * Open. You can then make changes to the basis in the Source Editor.
 */

package org.persvr.security;

import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.NativeObject;
import org.persvr.data.Persistable;

/**
 *
 * @author Kris Zyp
 */
public class ObjectAccessDeniedException extends EcmaError {
    public static final int BROWSE = 0;  // TODO: These constants should be combined with PermissionLevel
    public static final int LIMITED = 1;
    public static final int READ = 2;
    public static final int WRITE = 5;
    public static final int EXECUTE = 3;
    public static final int APPEND = 4;
    public static final int ACCESS_PERMISSION_LEVEL = 6;
    /** Creates a new instance of ObjectAccessDeniedException */
    public ObjectAccessDeniedException(final Persistable data, final int requestedAction) {
		super(new NativeObject(){
			public Object getDefaultValue(Class typeHint){
		        if (requestedAction == BROWSE || requestedAction == LIMITED)
		            return "Access denied to " + data + " you do not have any permission";
		        if (requestedAction == READ)
		            return "Access denied to " + data + " you do not have read permission";
		        if (requestedAction == WRITE)
		            return "Writing to " + data + " is not permitted, you do not have write permission";
		        if (requestedAction == EXECUTE)
		            return "Executing a method on " + data + " is not permitted, you do not have execute permission";
		        if (requestedAction == APPEND)
		            return "Appending to " + data + " is not permitted, you do not have append permission";
		        if (requestedAction == ACCESS_PERMISSION_LEVEL)
		            return "Deleting " + data + " is not permitted, you do not have delete permission";
		        return "Unknown security exception";
			}
		}, null,0,0,null);

    }	



}
