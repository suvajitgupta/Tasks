package org.persvr.remote;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;



public class InnerResponse implements HttpServletResponse {
	public void addCookie(Cookie arg0) {
		// TODO Auto-generated method stub
		
	}

	public void addDateHeader(String arg0, long arg1) {
		// TODO Auto-generated method stub
		
	}

	public void addIntHeader(String arg0, int arg1) {
		// TODO Auto-generated method stub
		
	}

	public boolean containsHeader(String arg0) {
		// TODO Auto-generated method stub
		return false;
	}

	public String encodeRedirectUrl(String arg0) {
		// TODO Auto-generated method stub
		return null;
	}

	public String encodeRedirectURL(String arg0) {
		// TODO Auto-generated method stub
		return null;
	}

	public String encodeUrl(String arg0) {
		// TODO Auto-generated method stub
		return null;
	}

	public String encodeURL(String arg0) {
		// TODO Auto-generated method stub
		return null;
	}

	public void sendRedirect(String arg0) throws IOException {
		// TODO Auto-generated method stub
		
	}

	public void setDateHeader(String arg0, long arg1) {
		// TODO Auto-generated method stub
		
	}

	public void setIntHeader(String arg0, int arg1) {
		// TODO Auto-generated method stub
		
	}

	public void setStatus(int sc) {
		statusCode = sc;
	}

	public void flushBuffer() throws IOException {
		// TODO Auto-generated method stub
		
	}

	public int getBufferSize() {
		// TODO Auto-generated method stub
		return 0;
	}

	public String getCharacterEncoding() {
		// TODO Auto-generated method stub
		return null;
	}

	public String getContentType() {
		// TODO Auto-generated method stub
		return null;
	}

	public Locale getLocale() {
		// TODO Auto-generated method stub
		return null;
	}

	public boolean isCommitted() {
		// TODO Auto-generated method stub
		return false;
	}

	public void reset() {
		// TODO Auto-generated method stub
		
	}

	public void resetBuffer() {
		// TODO Auto-generated method stub
		
	}

	public void setBufferSize(int arg0) {
		// TODO Auto-generated method stub
		
	}

	public void setCharacterEncoding(String arg0) {
		// TODO Auto-generated method stub
		
	}

	public void setContentLength(int arg0) {
		// TODO Auto-generated method stub
		
	}

	public void setLocale(Locale arg0) {
		// TODO Auto-generated method stub
		
	}

	public InnerResponse(String uri) {
		this.uri = uri;
	}
	String uri;
	Map<String,String> headers = new HashMap();
	public void addHeader(String name, String value) {
		// TODO Auto-generated method stub
		headers.put(name,value);
	}

	public void setHeader(String name, String value) {
		headers.put(name,value);
	}
	int statusCode = 200;
	String statusText = "OK";
	public void setStatus(int sc, String sm) {
		statusCode = sc;
		statusText = sm;
	}
	ByteArrayOutputStream baos = new ByteArrayOutputStream();
	ServletOutputStream outStream = new ServletOutputStream() {

		@Override
		public void write(int b) throws IOException {
			baos.write(b);
		}

		@Override
		public void write(byte[] b, int off, int len) throws IOException {
			baos.write(b,off,len);
		}

		@Override
		public void write(byte[] b) throws IOException {
			baos.write(b);
		}
		
	};

	public ServletOutputStream getOutputStream() throws IOException {
		
		return outStream;
	}
	public void resetResponse() {
		baos = new ByteArrayOutputStream();
	}
	public PrintWriter getWriter() throws IOException {
		// TODO Auto-generated method stub
		return new PrintWriter(outStream);
	}

	public String asString() {
		StringBuffer buffer = new StringBuffer("HTTP/1.1 " + statusCode + " " + statusText + "\n");
		String content = baos.toString();
		if (content.length() > 0) {
			headers.put("Content-Length", Integer.toString(content.length()));
			if (!headers.containsKey("Content-Type"))
				headers.put("Content-Type","application/json");
		}
		headers.put("Content-Location",uri);
		for (Entry<String,String> entry : headers.entrySet())
			buffer.append(entry.getKey() + ": " + entry.getValue() + "\n");
		buffer.append('\n');
		if (content.length() > 0)
			buffer.append(content);
		return buffer.toString();
	}

	public void sendError(int sc, String msg) throws IOException {
		// TODO Auto-generated method stub
		setStatus(sc,msg);
	}

	public void sendError(int sc) throws IOException {
		// TODO Auto-generated method stub
		setStatus(sc);
	}

	public void setContentType(String type) {
		// TODO Auto-generated method stub
		setHeader("Content-Type",type);
	}
}
