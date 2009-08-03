package org.persvr.job;

import java.io.File;

import org.persvr.data.GlobalData;

public class InstallStarterFiles implements Job {
	public static final String WEB_INF_FOLDER_NAME = "WEB-INF/";
	public void execute() {
		String webInfDirectory = GlobalData.getWebInfLocation().substring("file:/".length());
		if (File.separatorChar == '/')
			webInfDirectory = '/' + webInfDirectory;
		File starterFolder= new File(webInfDirectory + 
				File.separatorChar + "upgrade" + File.separatorChar + "starter");
		File rootFolder = new File(webInfDirectory.substring(0,webInfDirectory.length() - WEB_INF_FOLDER_NAME.length()));
		moveDirectory(starterFolder, rootFolder);
	}
	public void moveDirectory(File sourceLocation, File targetLocation) {
	    if (sourceLocation.isDirectory()) {
            if (!targetLocation.exists()) {
            	System.err.println("target location exists");
                sourceLocation.renameTo(targetLocation);
                return;
            }
            
            String[] children = sourceLocation.list();
            for (int i=0; i<children.length; i++) {
                moveDirectory(new File(sourceLocation, children[i]),
                        new File(targetLocation, children[i]));
            }
            
        } else {
        	if (!targetLocation.exists()) {
        		sourceLocation.renameTo(targetLocation);
        		return;
        	}
        }
		//sourceLocation.delete();
	}
}
