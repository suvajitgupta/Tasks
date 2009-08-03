package org.persvr.remote;

import java.io.IOException;
import java.io.Writer;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.persvr.Persevere;
import org.persvr.data.Persistable;
import org.persvr.data.PersistableList;
import org.persvr.remote.Client.PostResponse;
import org.persvr.util.JSON;

/**
 * 
 * @author Kris Zyp
 *PersevereServlet provides a base servlet class to build servlets that are JSPON aware. By being
 *JSPON aware, servlets may pass receive objects that are primitives or identifiable (instead of just strings) as parameters and output
 *objects (instead of just string text).  It is generally simpler to implement the 
 *PersevereAction class instead of this class, but implementing this class provides more flexibility.
 *Implementors of this class should implement the service method. The service method provides the 
 *RequestHelper that gives access to the parameters, request, and response.
 */
public abstract class PersevereServlet extends HttpServlet{
	public abstract class Action {
		public void setHeader(String name, String value) {
			if (headerTarget instanceof HttpServletResponse)
				((HttpServletResponse)headerTarget).setHeader(name,value);
			else if (headerTarget instanceof Map) {
				((Map)headerTarget).put(name, value);
			}
			else throw new RuntimeException("Unacceptable header target");
		}
		Object headerTarget;
		void setHeaderTarget(Object target) {
			headerTarget = target;
		}
		public boolean isCallback() {
			return headerTarget instanceof Map;
		}
		public abstract void doAction(Writer writer) throws Exception;
	}
	/**
	 * This method should be implemented to handle the action of the servlet
	 * @param requestHelper provides the information about the request and response
	 */
	protected void doPost(final RequestHelper requestHelper){
		throw new UnsupportedOperationException("post not implemented");
	}

	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    	RequestHelper requestHelper = new RequestHelper(request,response);
    	doPost(requestHelper);
	}
	/**
	 * This method should be implemented to handle the action of the servlet
	 * @param requestHelper provides the information about the request and response
	 */
	protected void doGet(final RequestHelper requestHelper) {
		throw new UnsupportedOperationException("get not implemented");
	}

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    	RequestHelper requestHelper = new RequestHelper(request,response);
    	doGet(requestHelper);
	}
	/**
	 * This method handles this situation where a cross-browser request is made, and the response must be 
	 * delivered as normal output or as a JSON-P response or as a hash to an iframe proxy. 
	 * @param request
	 * @param response
	 * @param action
	 */
	public static void handleOutputMethods(HttpServletRequest request, HttpServletResponse response, Action action) {
		try {
	        Writer out;
	        Map suffixHeader = null;
	        String suffixString = null;
			//System.err.println("Doing post response " + postResponseId + " post part " + doingRedirectedPost); 
	        if (request.getParameter("jsonp") != null) {
				action.setHeaderTarget(suffixHeader = new HashMap());
				out = response.getWriter();
				if (request.getPathInfo().endsWith(".js"))
					suffixString = "\n" + request.getParameter("jsonp") + "(temp";
				else
					out.write(request.getParameter("jsonp") + "(");
	    	}
			else {
				out = response.getWriter();
				action.setHeaderTarget(response);
			}
	        //response.setCharacterEncoding("UTF16");
	        //System.err.println("parameters " + parameters);

	    	if (suffixHeader != null) {
	            DateFormat formatter = new SimpleDateFormat("EEE, d MMM yyyy HH:mm:ss zzz");
	            formatter.setTimeZone(TimeZone.getTimeZone("GMT"));
		            suffixHeader.put("Date", formatter.format(new Date()));
	    	}
	    	try {
	    		action.doAction(out);
	    	}
	    	catch (Throwable e) {
	            e.printStackTrace();
	            while (e.getCause() != null && e.getCause() != e)
	            	e = e.getCause();
	            String reason = e.getMessage();
	            if (reason == null)
	            	out.write(" new Error(\"" + e.getClass() +  "\")");
	            else
	            	out.write(" new Error(" + JSON.quote(reason) +  ")"); 
	    	}
		    if (suffixString != null)
		    	out.write(suffixString);
	    	if (suffixHeader != null)
	    		out.write("," + suffixHeader + ");");
			out.close();
/*	    	if (asHash) {
	    		Writer realWriter = response.getWriter();
	    		String responseText = out.toString();
	    		if (responseText.length() > 2000)
	    			throw new RuntimeException("cross-domain iframe proxy hash based responses are not capable of handling over 2000 bytes at this point");
	    		realWriter.write("<html><script>window.location.hash=" + JSON.quote("{data:" + out.toString() + ",headers:" + suffixHeader.toString() + "}") + ";</script><body>cross-domain response</body></html>");
	    	}*/
		}
		catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	/**
	 * Handle range requests
	 * @param request
	 * @param value
	 * @return
	 */
	static Object handleRange(String range, Object value,Date requestDate,HttpServletResponse response) {
		if (range != null && value instanceof PersistableList) {
			if (range.startsWith("created")) { // TODO: Handle other ranges
/*				if (!range.startsWith("created now")) { // use the provided requestDate
					try {
						requestDate = PersevereFilter.preciseFormatter.parse(range.substring("created ".length()).split("-")[0]);
					} catch (ParseException e) {
						try {
							requestDate = new Date(Date.parse(range.substring("created ".length()).split("-")[0]));
						} catch (Exception e2) {
							e2.printStackTrace();
						}
					}
				}
				if (requestDate.before(new Date(100000000)))
					return value;
				PersistableList<Persistable> history = ((PersistableList)value).getHistory();
				List newEntries = Persevere.newArray(); // could this be an arraylist? 
				if (history != null) {
					for (Object historyEntryObj : history) 
						if (historyEntryObj instanceof Persistable){
							Persistable historyEntry = (Persistable) historyEntryObj;
							Date date = new Date(((Number) historyEntry.get("date")).longValue());
							if (date.after(requestDate)) {// TODO: make sure it was the last entry
								newEntries.add(historyEntry.get("value"));
						}
					}
				}
				response.setStatus(206,"Partial Content");
				response.setHeader("Content-Range", range);
				return newEntries;*/
			}
		}
		return value;
	}
}
