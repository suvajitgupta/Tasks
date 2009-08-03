package org.persvr.remote;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletInputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
/**
 * Class to parse a string of HTTP messages and inherit from the parent request
 * @author Kris
 *
 */
public class InnerRequest extends HttpServletRequestWrapper {
	// TODO: Implement the remaining methods from http servlet
	Map<String,String> headers = new HashMap();
	InnerRequest nextMessage;
	String method;
	String uri;
	String content;
	public InnerRequest(String message,HttpServletRequest request) {
		super(request);
		String[] parts = message.split("\r?\n\r?\n",2);
		message = parts[1];
		String[] headerStrs = parts[0].split("\r?\n");
		String[] methodParts = headerStrs[0].split(" ");
		method = methodParts[0];
		uri = methodParts[1];
		for (int i =1; i<headerStrs.length;i++) {
			String[] headerParts = headerStrs[i].split(": ?",2);
			headers.put(headerParts[0], headerParts[1]);
		}
		String contentLengthStr = headers.get("Content-Length");
		if (contentLengthStr != null) {
			int contentLength = Integer.parseInt(contentLengthStr);
			content = message.substring(0,Math.min(message.length(),contentLength));
			message = message.substring(Math.min(message.length(),contentLength+2));
		}
		if (message.length() > 0)
			nextMessage = new InnerRequest(message,request);
	}
	public InnerRequest getNextMessage() {
		return nextMessage;
	}
	
	@Override
	public String getContentType() {
		if (headers.containsKey("Content-Type"))
			return headers.get("Content-Type");
		return "application/json";// don't inherit from the container, or it will be message/http and will cause recursive parsing
	}
	@Override
	public String getHeader(String name) {
		if (headers.containsKey(name))
			return headers.get(name);
		return super.getHeader(name);
	}
	@Override
	public Enumeration getHeaderNames() {
		// TODO Auto-generated method stub
		return super.getHeaderNames();
	}
	@Override
	public Enumeration getHeaders(String name) {
		// TODO Auto-generated method stub
		return super.getHeaders(name);
	}
	@Override
	public String getMethod() {
		return method;
	}
	@Override
	public String getPathInfo() {
		return uri;
	}
	@Override
	public ServletInputStream getInputStream() throws IOException {
		// TODO Auto-generated method stub
		return super.getInputStream();
	}
	@Override
	public String getRequestURI() {
		// TODO Auto-generated method stub
		return uri;
	}
	
}
