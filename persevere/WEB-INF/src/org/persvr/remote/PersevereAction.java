package org.persvr.remote;

import java.io.IOException;
import java.io.Writer;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.swing.Action;
/**
 * 
 * @author Kris Zyp
 *PersevereAction allows one to easily implement a servlet that is JSPON aware. By implementing the 
 *execute method, implementation will receive a map of parameters where the values are translated to objects
 *(identifiable objects and primitives) and can return an object that will be returned to the JSPON
 *client.
 */
public abstract class PersevereAction extends HttpServlet {
	/**
	 * This method should be implemented to handle the action of the servlet
	 * @param parameters This is a map of parameters of the request converted to objects 
	 * @param requestHelper provides the information about the request and response
	 */
	protected abstract Object execute(Map<String,Object> parameters,PersevereRequest request) throws Exception;
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			((PersevereResponse)response).getWriter().write(((PersevereResponse)response).outputReturnObject(execute(((PersevereRequest)request).getParametersAsObjects(),((PersevereRequest)request))));
		}
		catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			((PersevereResponse)response).getWriter().write(((PersevereResponse)response).outputReturnObject(execute(((PersevereRequest)request).getParametersAsObjects(),((PersevereRequest)request))));
		}
		catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
