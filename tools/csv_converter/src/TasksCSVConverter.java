import au.com.bytecode.opencsv.*;
import java.io.*;
import java.util.*;

/**
 * Converts a given CSV file (supplied on the command-line) to a Tasks-formatted text file.
 *
 * TODO: [SE] pull logic out of main() and into class methods (in other words, make it reusable and OO)
 * TODO: [SE] improve validation of allowed strings (validation, status, type, priority)
 *
 * @author Sean Eidemiller (sean@halcyon.cc)
 */
public class TasksCSVConverter {

  private static final String PRIORITY = "priority";
  private static final String NAME = "name";
  private static final String DESCRIPTION = "description";
  private static final String COMPONENT = "component";
  private static final String EXTERNAL_KEY = "external key";
  private static final String TYPE = "type";
  private static final String SUBMITTER = "submitter";
  private static final String ASSIGNEE = "assignee";
  private static final String VALIDATION = "validation";
  private static final String STATUS = "status";
  private static final String EFFORT = "effort";

  public static void main(String[] args) {
    // Do some sanity checking.
    if (args.length < 3) errorAndExit("Usage: java TasksCSVConverter <Project Name> <CSV File> <Out File>");

    File cf = new File(args[1]);
    File of = new File(args[2]);
    String pn = args[0].trim();

    if (pn.length() <= 0) errorAndExit("ERROR: Project name not specified.");
    if (!cf.canRead()) errorAndExit("ERROR: Unable to read CSV file: " + args[1]);
    if (cf.length() <= 0) errorAndExit("ERROR: CSV file is empty: " + args[1]);
    if (of.exists() && !of.canWrite()) errorAndExit("ERROR: Unable to write output file: " + args[2]);

    // Open the streams, create the CSV parser and get the list of tasks.
    List tasks = null;
    CSVReader reader = null;
    FileWriter writer = null;

    try {
      System.out.print("Opening streams... ");
      reader = new CSVReader(new FileReader(cf));
      writer = new FileWriter(of);
      System.out.print("OK\n");
      System.out.print("Parsing/tokenizing CSV file... ");
      tasks = reader.readAll();
      System.out.print("OK\n");
    } catch (IOException ioe) {
      errorAndExit("ERROR: " + ioe.getMessage());
    }

    System.out.print("Convert to Tasks format... ");

    // Write the project line.
    try {
      writer.write(pn + "\n");
    } catch (IOException ioe) {
      closeStreams(reader, writer);
      errorAndExit("ERROR: " + ioe.getMessage());
    }

    // Build the header indices map.
    Map<String, Integer> headerIndices = new HashMap<String, Integer>();
    headerIndices.put(PRIORITY, null);
    headerIndices.put(NAME, null); 
    headerIndices.put(DESCRIPTION, null);
    headerIndices.put(COMPONENT, null);
    headerIndices.put(EXTERNAL_KEY, null);
    headerIndices.put(TYPE, null);
    headerIndices.put(SUBMITTER, null);
    headerIndices.put(ASSIGNEE, null);
    headerIndices.put(VALIDATION, null);
    headerIndices.put(STATUS, null);
    headerIndices.put(EFFORT, null);

    // Build the priorities map.
    Map<String, String> priorities = new HashMap<String, String>();
    priorities.put("high", "^ ");
    priorities.put("medium", "- ");
    priorities.put("low", "v ");

    // Get the column headers from the CSV file and map to known headers (the first line should be
    // the header names).
    Iterator<String[]> iter = tasks.iterator();
    String headrName = null;

    if (iter.hasNext()) {
      String[] headerLine = iter.next();
      for (int i = 0; i < headerLine.length; i++) {
        headrName = headerLine[i].trim().toLowerCase();
        if (headerIndices.containsKey(headrName)) {
          headerIndices.put(headrName, i);
        } else {
          System.err.println("WARNING: Discarding unrecognized column header: " + headerLine[i]);
        }
      }

    } else {
      errorAndExit("ERROR: CSV file is empty: " + args[1]);
    }

    // Iterate through the entries and convert to Tasks format.
    StringBuilder line;
    String[] task;
    Integer idx = null;
    String temp = null;
    String name = null;
    String priority = null;

    while (iter.hasNext()) {
      task = iter.next();
      line = new StringBuilder();

      // Get the name; short-circuit if blank (name is required).
      name = formatField(headerIndices, NAME, task);
      if (name == null) continue;

      // Append the priority.
      priority = formatField(headerIndices, PRIORITY, task, "%s", false, priorities);
      if (priority != null) {
        line.append(priority);
      } else {
        // Assume medium.
        line.append("- ");
      }

      // Append external key (if specified).
      temp = formatField(headerIndices, EXTERNAL_KEY, task, "%s: ");
      if (temp != null) line.append(replaceNewlines(temp));

      // Append component (if specified).
      temp = formatField(headerIndices, COMPONENT, task, "%s: ");
      if (temp != null) line.append(replaceNewlines(temp));

      // Append name.
      line.append(replaceNewlines(name));

      // Append time estimate (in days).
      temp = formatField(headerIndices, EFFORT, task, " {%s}");
      if (temp != null) line.append(temp);

      // Append the type (if specified).
      temp = formatField(headerIndices, TYPE, task, " $%s", true);
      if (temp != null) line.append(temp);

      // Append the submitter (if specified).
      temp = formatField(headerIndices, SUBMITTER, task, " <%s>");
      if (temp != null) line.append(temp);

      // Append the assignee (if specified).
      temp = formatField(headerIndices, ASSIGNEE, task, " [%s]");
      if (temp != null) line.append(temp);

      // Append the status (if specified).
      temp = formatField(headerIndices, STATUS, task, " @%s", true);
      if (temp != null) line.append(temp);

      // Append the validation (if specified).
      temp = formatField(headerIndices, VALIDATION, task, " %%s", true);
      if (temp != null) line.append(temp);

      // Write the line(s) to the output file.
      try {
        writer.write(line.toString() + '\n');

        // Is there a description?
        temp = formatField(headerIndices, DESCRIPTION, task, "| %s");
        if (temp != null) writer.write(temp.replaceAll("\n", "\n| ") + '\n');

      } catch (IOException ioe) {
        closeStreams(reader, writer);
        errorAndExit("ERROR: " + ioe.getMessage());
      }
    }

    System.out.print("OK\n");

    // Clean shit up and exit.
    System.exit(closeStreams(reader, writer));
  }

  private static String formatField(Map hdrIndices, String hdrName, String[] task) {
    return formatField(hdrIndices, hdrName, task, "%s");
  }

  private static String formatField(Map hdrIndices, String hdrName, String[] task, String fmt) {
    return formatField(hdrIndices, hdrName, task, fmt, false, null);
  }

  private static String formatField(Map hdrIndices, String hdrName, String[] task, String fmt,
    boolean capitalize) {

    return formatField(hdrIndices, hdrName, task, fmt, capitalize, null);
  }

  private static String formatField(Map<String, Integer> hdrIndices, String hdrName, String[] task,
    String fmt, boolean capitalize, Map<String, String> translationMap) {

    String ret = null;
    Integer idx = hdrIndices.get(hdrName);

    if (idx != null) {
      String val = task[idx.intValue()];
      if (val != null) {
        val = val.trim();
        if (val.length() > 0) {
          if (translationMap != null) {
            ret = translationMap.get(val.toLowerCase());
          } else {
            if (capitalize == true) val = capitalize(val);  
            ret = String.format(fmt, val);
          }
        }
      }
    }

    return ret;
  }

  private static String capitalize(String s) {
    if (s == null || s.length() == 0) return s;
    return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
  }

  private static String replaceNewlines(String str) {
    if (str != null) {
      return str.replaceAll("\n", " ");
    } else {
      return null;
    }
  }

  private static int closeStreams(CSVReader reader, FileWriter writer) {
    try {
      System.out.print("Closing streams... ");
      if (reader != null) reader.close();
      if (writer != null) writer.close();
      System.out.print("OK\n");
    } catch (IOException ioe) {
      System.err.println("Error closing streams: " + ioe.getMessage());
      return 1;  
    }

    return 0;
  }

  private static void errorAndExit(String errMessage) {
    System.err.println(errMessage);
    System.exit(1);
  }
}
