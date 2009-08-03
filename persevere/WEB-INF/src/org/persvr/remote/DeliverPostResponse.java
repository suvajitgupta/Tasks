package org.persvr.remote;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.methods.GetMethod;

public class DeliverPostResponse extends HttpServlet {
	  @Override
	public void doGet(HttpServletRequest request,
              HttpServletResponse response)
	throws ServletException, IOException {
	response.setContentType("text/html");
		PrintWriter out = response.getWriter();
		out.write("<html><script>\nparent.");
		String body = request.getParameter("responseText");
		if (body == null) {
			HttpClient client = new HttpClient();
			HttpMethod method = new GetMethod(request.getParameter("responseUrl"));		
			client.executeMethod(method);
			body=method.getResponseBodyAsString();
		}
		out.write(body);
		out.write("</script></html>");
	}
}
