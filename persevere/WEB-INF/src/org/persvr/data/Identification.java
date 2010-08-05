package org.persvr.data;

import java.lang.ref.Reference;
import java.lang.ref.SoftReference;
import java.util.regex.Pattern;

import org.mozilla.javascript.Scriptable;
import org.persvr.Persevere;
import org.persvr.datasource.DataSource;
import org.persvr.datasource.HttpJsonSource;
import org.persvr.datasource.LocalJsonFileSource;
import org.persvr.remote.AliasIds;
import org.persvr.remote.Client;
import org.persvr.remote.AliasIds.AliasHandler;
/**
 * An Identification represents an id of object or a value. This allows objects or values to be reference 
 * without the actual object being loaded into the object graph yet. When the object or value
 * is needed, the identification object can retrieve it (by calling getTarget)
 * @author Kris Zyp
 *
 * @param <T> base type of objects that can be referred to
 */
public abstract class Identification<T> implements TargetRetriever<T> {
//	TODO: make objectId and source be package protected
	static Pattern slashPattern = Pattern.compile("[^\\[\\.\\?]*/");
	/**
	 * Gets an id for a given string
	 * @param value
	 * @return
	 */
	public static Identification<? extends Object> idForString(String value) {
		if (value.length() > 0 && value.charAt(0)=='/')
			value = value.substring(1);
		int pathIndex = Math.min(Math.min(Math.min(value.indexOf('[') > 0 ? value.indexOf('[') : 10000, value.indexOf('.') > 0 ? value.indexOf('.') : 10000),value.indexOf('?') > 0 ? value.indexOf('?') : 10000),value.indexOf('#') > 0 ? value.indexOf('#') : 10000);
		if (pathIndex < 10000){
			// this is hack so that we treat config file entity references as object ids
			if(value.indexOf(LocalJsonFileSource.pathSeparator) != -1){
				pathIndex = 10000;
			}
		}
		String subObjectId;
		DataSource source = null;
		String path = null;
		int slashIndex = value.length();
		if (value.indexOf("/") > 0 && value.indexOf("/") < pathIndex){
			while((slashIndex = value.substring(0,slashIndex).lastIndexOf('/')) > -1){
				String sourcePart = value.substring(0,slashIndex);
				source = DataSourceManager.getSource(sourcePart);
				if (source != null)
					break;
			}
			if (source == null)
				return new ObjectNotFoundId(null,value);
			String idPart = value.substring(slashIndex + 1);
			subObjectId = idPart;
			/*if (pathIndex < 10000 && !(source instanceof HttpJsonSource)) {
				pathIndex = pathIndex - sourcePart.length() - 1;
				path = subObjectId.substring(pathIndex);
				subObjectId = subObjectId.substring(0,pathIndex);
			}*/
		}
		else {
			subObjectId = value;
			if (pathIndex < 10000) {
				path = subObjectId.substring(pathIndex);
				subObjectId = subObjectId.substring(0,pathIndex);
			}
			source = DataSourceManager.getSource(subObjectId);
			if (source == null) {
				AliasHandler handler = AliasIds.getAliasHandler(subObjectId);
				ObjectId objId;
				if (handler == null) {
					return new ObjectNotFoundId(source,value);
				}
				objId = handler.getTarget().getId();
				source = objId.getSource();
				if (source == null && handler != null)
					return handler;
				subObjectId = objId.getSubObjectId();
			}
			else 
				subObjectId = ""; // this is a direct reference to the source, the id should be null
		}
		String slashedSubObjectId = null;
		if (subObjectId != null) {
			/*while (!subObjectId.equals(slashedSubObjectId)) {
				slashedSubObjectId = subObjectId;
				subObjectId = subObjectId.replaceAll("^([^\\[]+)/", "$1."); // allow slashes to indicate property references
			}*/
			int legalDotStart = 0;
			if (source instanceof HttpJsonSource && source.getId().length() < 8) {
				// if we are using a remote address, the first dots can be part of the hostname and should be ignored
				legalDotStart = subObjectId.indexOf('/', 2);
			}
			pathIndex = Math.min(Math.min(subObjectId.indexOf('[') > -1 ? subObjectId.indexOf('[') : 10000, subObjectId.indexOf('.', legalDotStart) > -1 ? subObjectId.indexOf('.', legalDotStart) : 10000),subObjectId.indexOf('?') > -1 ? subObjectId.indexOf('?') : 10000);
			if (pathIndex < 10000 && 
					// this is hack so that we treat config file entity references as object ids
					subObjectId.indexOf(LocalJsonFileSource.pathSeparator) == -1) {
				if (source instanceof HttpJsonSource) {					
					return RemoteQuery.idForObject(source, subObjectId);
				}
				path = subObjectId.substring(pathIndex);
				subObjectId = subObjectId.substring(0,pathIndex);
			}
		}
		// Need to process path if path is there and one of path does not
		// start with ?, or subObjectId is "" or null is true
		if (path != null && ( ( subObjectId == null ) ||
				( subObjectId.length() == 0 ) || path.charAt( 0 ) != '?' ) ) {
			path = path.replaceAll("^([^\\.]+)#\\.?","$1.");
			if (JsonPath.isDefinite(value))
				return ObjectPath.idForObject(source,subObjectId,path);
			return JsonPath.idForObject(source,subObjectId,path);
		}
		return ObjectId.idForObject(source,subObjectId);
		 
			
	}
	static String absolutePathPrefix = null;
	public static Identification<? extends Object> idForRelativeString(String startingId, String targetId) {
		if(targetId.startsWith("cid:")){
			targetId = targetId.substring(4);
			if(targetId.startsWith("/"))
				targetId = targetId.substring(absolutePathPrefix.length());
			Client client = Client.getCurrentObjectResponse().getConnection();
			Persistable obj = client.getClientSideObject(targetId);
			if(obj == null) {
				String sourceName = targetId.substring(0, targetId.indexOf('/'));
				obj = client.clientSideObject(targetId, Persevere.newObject(sourceName));
			}
			return obj.getId();
		}
		boolean absoluteStart = startingId.matches("\\w+tps?:/.*");
		if (targetId.startsWith("/")){
			if (absoluteStart)
				return Identification.idForString(startingId.substring(0,startingId.indexOf('/',2)) + targetId);
			else
				return Identification.idForString(targetId.substring(absolutePathPrefix.length()));
		}
			
		if (targetId.startsWith("../")){
			if (absoluteStart)
				return Identification.idForString(startingId.substring(0,startingId.lastIndexOf('/',startingId.lastIndexOf('/')-1)) + targetId.substring(2));
			else
				return Identification.idForString(targetId.substring(3));
		}
		if (targetId.matches("\\w+tps?:/.*")){
			if(targetId.startsWith(GlobalData.localURI)){
				return Identification.idForString(targetId.substring(GlobalData.localURI.length()));
			}
			return ObjectId.idForString(targetId);
		}
		return Identification.idForString(startingId.substring(0,startingId.lastIndexOf('/')+1) + targetId);
	}
	public String subObjectId;
	Reference<T> targetRef; // this is generally a soft reference, but sometimes it must be a strong/direct reference
	public DataSource source; 
	public boolean isLoaded(){
		return targetRef != null && targetRef.get() != null;
	}
	public boolean isForeign() {
		return source != null && (source.getId().toLowerCase().startsWith("http://") || source.getId().toLowerCase().startsWith("https://"));
	}
	/**
	 * Implementations should implement this to resolve a target when it has not been loaded yet
	 * @return object referred to by identification
	 */
	protected abstract T resolveTarget();
	/**
	 * Retrieves the value or object referred to by this identification
	 * @return object referred to by identification
	 */	
	public synchronized T getTarget() {
		T finalTarget;
		if (targetRef == null || (finalTarget = targetRef.get()) == null) {
			finalTarget = resolveTarget();
	        targetRef = new SoftReference<T>(finalTarget);
		}
		return finalTarget;
	}
	public String getSubObjectId() {
		return subObjectId;
	}
	public DataSource getSource() {
		return source;
	}
    protected String relativePath(String originalPath, String newPath) {
    	if (newPath.startsWith(originalPath))
    		return newPath.substring(originalPath.length());
    	int firstQuestionMark = originalPath.indexOf("?");
    	int originalSlash = originalPath.lastIndexOf('/', firstQuestionMark == -1 ? originalPath.length() - 1 : firstQuestionMark);
    	
    	if (originalSlash > -1) {
    		int secondToLastSlash = originalPath.lastIndexOf('/', originalSlash - 1);
    		return "../" + relativePath(originalPath.substring(0,secondToLastSlash + 1), newPath);
    	}
    	
    	return newPath; 
    }
    /**
     * Makes a string based on relative path
     * @param relativeSource
     * @param relativeSubPath
     * @return
     */
    public String toString(DataSource relativeSource, String relativeSubPath) {
    	if (source == relativeSource) {
    		if (relativeSubPath == null || source instanceof HttpJsonSource)
    			return subObjectId;
    		else
    			return relativePath(relativeSubPath, subObjectId);
    	}
		else {
	    	if (source instanceof HttpJsonSource || relativeSource == null){
	    		if(relativeSource instanceof HttpJsonSource){
	    			return relativePath(relativeSource.getId() + '/' + relativeSubPath, toString());
	    		}
	    		return toString();
	    	}
			else
				return "../" + toString();
		}
    }
    @Override
	public String toString() {
    	if (source == null || source.getId().length() == 0)
    		return subObjectId;
    	else if (subObjectId == null)
    		return source.getId();
    	else
    		return source.getId() + "/" + subObjectId;
    }
	public static String getAbsolutePathPrefix() {
		return absolutePathPrefix;
	}
	public static void setAbsolutePathPrefix(String absolutePathPrefix) {
		Identification.absolutePathPrefix = absolutePathPrefix;
		Scriptable global = GlobalData.getGlobalScope();
		Scriptable pjs = (Scriptable) global.get("pjs", global);
		pjs.put("absolutePathPrefix", pjs, absolutePathPrefix);
	}

}
