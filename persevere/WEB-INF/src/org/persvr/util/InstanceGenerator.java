package org.persvr.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

import org.apache.commons.io.FileUtils;

public class InstanceGenerator {
    
  public static void createNewInstance(String instancePath, String instanceName) throws IOException
  {
    File instanceParent = new File(instancePath);
    if(!instanceParent.exists() || !instanceParent.isDirectory())
      throw new RuntimeException("can't create new instance at " + instancePath + ", it's not a directory");
    String sep = File.separator;
    String persvrHome = System.getProperty("persevere.home");
    if(persvrHome == null)
    	persvrHome = ".";
    String instanceRoot = instancePath + sep + instanceName;
    File instanceTest = new File(instanceRoot);
    if(instanceTest.exists())
      throw new RuntimeException(instanceRoot + " already exists - exiting");
    
    createInstanceElement(instanceRoot, true);
    createInstanceElement(instanceRoot + sep + "images", true);
    createInstanceElement(instanceRoot + sep + "css", true);
    
    String t = persvrHome + sep + "WEB-INF/templates";
    FileUtils.copyFileToDirectory(new File(t + sep + "index.html"), new File(instanceRoot));
    System.out.println("Creating " + instanceRoot + sep + "index.html...");
    FileUtils.copyFileToDirectory(new File(t + sep + "ReadMe"), new File(instanceRoot));
    System.out.println("Creating " + instanceRoot + sep + "ReadMe...");
    
    
    String webinf = createInstanceElement(instanceRoot + sep + "WEB-INF", true).getAbsolutePath();
    createInstanceElement(webinf + sep + "config", true);
    createInstanceElement(webinf + sep + "data", true);
    createInstanceElement(webinf + sep + "jslib", true);
    String testDir = createInstanceElement(webinf + sep + "tests", true).getAbsolutePath();
    FileUtils.copyFile(new File(t + sep + "tests.js"), new File(testDir + sep + instanceName + "_tests.js"));
    System.out.println("Creating " + testDir + sep + instanceName + "_tests.js");
    
    FileUtils.copyFileToDirectory(new File(persvrHome + sep + "WEB-INF/web.xml"), new File(webinf));
  }
  
  /*
   * Create a new element at 'path' - if it's not a directory, it's a file.
   */
  private static File createInstanceElement(String path, boolean isDir) throws IOException
  {
    File f = new File(path);
    System.out.println("Creating " + f.getAbsolutePath() + "...");
    if(isDir)
      f.mkdir();
    else
      f.createNewFile();
    return f;
  }
  
  public static void eraseDatabase(String instancePath) throws IOException
  {
    String sep = File.separator;
    File instanceDB = new File(instancePath + sep + "WEB-INF" + sep + "data");
    if(!instanceDB.exists())
    {
      System.err.println(instanceDB.getAbsolutePath() + "doesn't exist...exiting"); 
      System.exit(1);
    }
    
    String response = new String();
    
    System.out.print("Delete data at " + instanceDB.getAbsolutePath() + "? (y|n) ");
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    
    try { 
      response = br.readLine(); 
   } catch (IOException ioe) { 
      System.err.println("error reading response...exiting"); 
      System.exit(1);
   }
   if(response.equals("y") || response.equals("yes"))
   {
     System.out.println("Deleting data at " + instanceDB.getAbsolutePath() + "...");
     System.out.println("A new database will be initialized when you restart.");
     FileUtils.deleteDirectory(instanceDB);
   }
   else if(response.equals("n") || response.equals("no"))
     System.out.println("Not deleting data...exiting.");
   else
     System.out.println("Invalid response - valid responses are 'y' or 'n'.");
   
  }
}


