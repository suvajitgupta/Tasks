package org.persvr.remote;

import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;

import org.persvr.remote.Client.IndividualRequest;

public class PersevereRequest extends HttpServletRequestWrapper {
	RequestHelper helper;
	boolean disable304;
	PersevereRequest(HttpServletRequest request, RequestHelper helper, boolean disable304) {
		super(request);
		this.helper = helper;
		this.disable304 = disable304;
	}
	
	/**
	 * This takes the request parameters that come from the browser and string values and converts them to
	 * objects and primitives using JSPON conversion
	 * @return A map of the parameters with their correct objects as values
	 */
	public Map<String,Object> getParametersAsObjects() {
		return helper.getParametersAsObjects();
	}
	/**
	 * This converts a string value to an object using JSPON conversion. For instance the string:<br>
	 * <code>{"id":"3"}</code><br>
	 * Should return the object with id of 3.
	 * @param parameterValue string JSPON representation of the object
	 * @return The object converted from JSPON
	 */
	public Object convertParameterValueToObject(String parameterValue) {
		return helper.convertJsonStringToObject(parameterValue);
	}
	@Deprecated
	public RequestHelper getHelper() {
		return helper;
	}

	@Override
	public long getDateHeader(String name) {
		if (disable304 && "If-Modified-Since".equals(name))
			return 0;
		return super.getDateHeader(name);
	}

}
