package org.persvr.util;

import java.io.IOException;

import org.mortbay.jetty.servlet.DefaultServlet;
import org.mortbay.resource.Resource;

public class PersevereDefaultServlet extends DefaultServlet {
    public Resource getResource(String pathInContext){
    	try{
    		Resource resource = (Resource) getServletContext().getAttribute("persevere.resource");
    		if(resource != null)
    			return resource.addPath(pathInContext);
    	}catch(IOException e){
    	}
    	return super.getResource(pathInContext);
	}
}
