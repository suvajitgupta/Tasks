package org.persvr.datasource;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.codec.binary.Base64;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;
import org.persvr.data.BinaryData;
import org.persvr.data.DataSourceManager;
import org.persvr.data.FunctionUtils;
import org.persvr.data.Identification;
import org.persvr.data.ObjectId;
/**
 * This provides a starting implementation of a DataSource.
 * @author Kris Zyp
 *
 */
public abstract class BaseDataSource implements DataSource {
	protected ObjectId idForString(String id) {
		return ObjectId.idForObject(this, id);
	}
	String id;
	public static final String REQUIRED_PREFIX = "__"; 
    public static final String LINK_HEADER = "__link:";
    public static final String STRING_HEADER = "__string:";
    public static final String BINARY_HEADER = "__binary:";
    public static final String LONG_HEADER = "__long:";
    public static final String DATE_HEADER = "__date:";
    public static final String FUNCTION_HEADER = "__function:";
    public static final String OBJECT_HEADER = "__object:";
    public static final String DOUBLE_HEADER = "__double:";
    public static final String DECIMAL_HEADER = "__decimal:";
    public static final String INTEGER_HEADER = "__integer:";
    public static final String BOOLEAN_TRUE = "__true";
    public static final String BOOLEAN_FALSE = "__false";
    public static final String UNDEFINED = "__undefined";
/**
 * For object types that can not be handled by default for the implemented data source, this method can be called
 * to convert an object to a string for storage  
 * @param value
 * @return string representation of the value
 */    
    protected String convertObjectToString(Object value) {
        if (value instanceof Boolean)
            return value.toString();

        if (value instanceof Long) {
            return LONG_HEADER + value; 
        }
        if (value instanceof Integer) {
            return INTEGER_HEADER + value; 
        }
        if (value instanceof Number) {
        	return DECIMAL_HEADER + value;
        }
        if (value instanceof Date) {
            return DATE_HEADER + ((Date) value).getTime();
        }
        if (value instanceof Function) {
            return FUNCTION_HEADER + FunctionUtils.getSource((Function) value);
        }
        if (value==Scriptable.NOT_FOUND) {
            return UNDEFINED;
        }
        if (value instanceof ObjectId) {
            return LINK_HEADER + value;
        }
        if (value instanceof String) {
            String valueString = (String) value;
            if (valueString.startsWith(REQUIRED_PREFIX) && (valueString.startsWith(LINK_HEADER) ||
                    valueString.startsWith(STRING_HEADER) ||
                    valueString.startsWith(LONG_HEADER) ||
                    valueString.startsWith(INTEGER_HEADER) ||
                    valueString.equals(BOOLEAN_TRUE) ||
                    valueString.equals(BOOLEAN_FALSE)))
                return STRING_HEADER + valueString;
            return valueString;
        }
        if (value instanceof BinaryData){
			return BINARY_HEADER + (new String(Base64.encodeBase64(((BinaryData)value).getBytes())));
        }
        if (value instanceof Scriptable){
        	throw new RuntimeException("Can not store transient-only objects, persistable objects must be created as object literals or through class instantiation");
        }
        if (value instanceof Serializable) {
        	ByteArrayOutputStream baos = new ByteArrayOutputStream();
        	try {
				ObjectOutputStream oos = new ObjectOutputStream(baos);
				oos.writeObject(value);
			} catch (IOException e) {
				throw new RuntimeException(e);
			}
        	return OBJECT_HEADER + new String(baos.toByteArray());
        }
        throw new RuntimeException("Unable to directly write object of class " + value.getClass());
    }
    /**
     * For strings that were created from convertObjectToString, this method can be called to restore (deserialize) the
     * string back to an object 
     * @param value
     * @return the object that was represented by the string
     */
    protected Object convertStringToObject(String value) {
    	if (value.startsWith(REQUIRED_PREFIX)) {
	        if (value.startsWith(LINK_HEADER)) {
	            value = value.substring(LINK_HEADER.length());
	            try {
	            	if("root".equals(value))
	            		return DataSourceManager.getRootObject();
	            	return Identification.idForString(value).getTarget();
	            }
	            catch (Exception e) {
	            	System.err.println(e.getMessage() + " trying to get " + value);
	            }
	        }
	        if (value.startsWith(STRING_HEADER)) { // this must be provided in case a string must really be a string and it uses keywords i.e. string:link:3422fdasf
	            value = value.substring(STRING_HEADER.length());
	            return value;
	        }
	        if (value.startsWith(LONG_HEADER)) { 
	            value = value.substring(LONG_HEADER.length());
	            return new Long(value);
	        }
	        if (value.startsWith(INTEGER_HEADER)) { 
	            value = value.substring(INTEGER_HEADER.length());
	            return new Integer(value);
	        }
	        if (value.startsWith(DECIMAL_HEADER)) {
	            value = value.substring(DECIMAL_HEADER.length());
	            try{
	            	return new BigDecimal(value);
	            }
	            catch(NumberFormatException e){
	            	if("NaN".equals(value) || value.endsWith("Infinity")){
	            		return new Double(value);
	            	}
	            }
	        }
	        if (value.startsWith(DATE_HEADER)) { 
	            value = value.substring(DATE_HEADER.length());
	            return new Date(new Long(value).longValue());
	        }
	        if (value.startsWith(FUNCTION_HEADER)) { 
	            value = value.substring(FUNCTION_HEADER.length());
	            return FunctionUtils.createFunction(value, "function");
	        }
	        if (value.startsWith(OBJECT_HEADER)) {         	
	            value = value.substring(OBJECT_HEADER.length());            
	            try {
					ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(value.getBytes()));
					return ois.readObject();
				} catch (Exception e) {
					throw new RuntimeException(e);
				}
	        }
	        if (value.startsWith(BINARY_HEADER)) {
	        	value = value.substring(BINARY_HEADER.length());
				return new BinaryData(Base64.decodeBase64(value.getBytes()));
	        }
	        if (value.equals(UNDEFINED)) { 
	            return Undefined.instance;
	        }
	        if (BOOLEAN_FALSE.equals(value))
	            return Boolean.FALSE;
	        if (BOOLEAN_TRUE.equals(value))
	            return Boolean.TRUE;
	        if (value.startsWith(DOUBLE_HEADER)) { 
	            value = value.substring(DOUBLE_HEADER.length());
	            return new Double(value);
	        }
    	}
        return value;
    }

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}
	/**
	 * This can be called from mapObject to initialize an object using a map
	 * @param initializer
	 * @param map
	 */
	protected void initializeFromMap(PersistableInitializer initializer, Map<String,Object> map) throws Exception {
        for (Entry<String,Object> entry : map.entrySet()) {
        	initializer.setProperty(entry.getKey(), entry.getValue());
        }        
	}

}
