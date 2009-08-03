package org.persvr.remote;

import java.util.Map.Entry;

import org.mozilla.javascript.Function;
/**
 * This is an interface for outputting JavaScript Function objects for different
 * client architectures. 
 * @author Kris Zyp
 *
 */
public interface ClientTransformationPlugin {
	/**
	 * This should take a function and return a property to be added to outbound objects to enhance them for use with client applications
	 * @param function
	 * @param debugMode
	 * @return property to add to the object
	 */
	public Entry<String,String> augmentJsponForFunction(Function function,boolean debugMode);
}
