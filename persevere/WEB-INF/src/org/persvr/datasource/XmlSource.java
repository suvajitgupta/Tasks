package org.persvr.datasource;

import java.io.File;
import java.io.IOException;
import java.util.AbstractCollection;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.persvr.data.DataSourceHelper;
import org.persvr.data.LazyPropertyId;
import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.persvr.data.Query;
import org.persvr.data.Version;
import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;
/**
 * Example implementation of an XML data source
 * @author Kris Zyp
 *
 */
public class XmlSource extends BaseDataSource {

	String idAttribute = "id";
    String idRefAttribute = "idref";

    public Object getFieldValue(LazyPropertyId valueId) throws Exception {
		// not used here
		throw new UnsupportedOperationException();
	}
	private String url;
    protected File file;
    long lastModified;
	public void initParameters(Map<String,Object> parameters) throws Exception {
		url = (String)parameters.get("url");
		if (url.startsWith("file:\\"))
			url = url.substring(6);
		if (parameters.containsKey("idAttribute"))
			idAttribute = (String) parameters.get("idAttribute");
		readXml();
	}
    protected void readXml() {
        try {
        	DocumentBuilder parser = DocumentBuilderFactory.newInstance().newDocumentBuilder();
//        	builder.p
   //         DOMParser parser = new DOMParser();
            
            String fullFilename;
     /*  if (HTMLGlobal.context != null)
             fullFilename = HTMLGlobal.context.getRealPath(url);
       else*/
            
            fullFilename = (url.startsWith("/") ? "file:" : "file:/") + url;
            file = new File(url);
            lastModified = file.lastModified();
            //lastModified = file.lastModified();
            doc = parser.parse(fullFilename);
            //doc = parser.getDocument();
            checkForDuplicateIds(new TreeSet(), doc.getDocumentElement());
        } catch (SAXException ex) {
            throw new RuntimeException(ex);
        } catch (IOException ex) {
            throw new RuntimeException(ex);
        }
        catch (ParserConfigurationException ex) {
        	throw new RuntimeException(ex);
        }
    }
	protected String findMultipleTag(Element element) {
		NodeList nl = element.getChildNodes();
		int multiples = 0;
		String multipleName = null;
		Map<String,Integer> childNames = new HashMap();
		for (int i = 0; i < nl.getLength(); i++) {
			Node node = nl.item(i);
			if (node instanceof Element) {
				String name = ((Element) node).getTagName();
				if (childNames.containsKey(name)) {
					if (childNames.get(name) == 0) {
						multiples++;
						multipleName = name;
						childNames.put(name,1);	
					}
				}
				else
					childNames.put(name,0);	
			}
		}
		if (multiples > 1)
			throw new RuntimeException("Multiple repeating same tag name children is not supported");
		return multipleName;
	}
	public void mapObject(final PersistableInitializer initializer, String objectId) throws Exception {
		Element element = getElementById(objectId);
		if (element == null)
			throw new RuntimeException("The given id " + objectId + " was not found");
		mapElement(initializer, element);
	}
	private void mapElement(final PersistableInitializer initializer, Element element) throws Exception {
		NamedNodeMap attributes = element.getAttributes();
		for (int i = 0; i < attributes.getLength(); i++) {
			Attr attr = (Attr) attributes.item(i);
			if (!attr.getName().equals(idAttribute))
				initializer.setProperty(attr.getName(), convertStringToObject(attr.getValue()));
		}		
		final NodeList nl = element.getChildNodes();
		final String multipleName = findMultipleTag(element);
		if (multipleName != null){
			int size = 0;
			while (size < nl.getLength() && (!(nl.item(size) instanceof Element) || !((Element)nl.item(size)).getTagName().equals(multipleName)))
				size++;

			initializer.initializeList(new AbstractCollection(){
				public Iterator iterator(){
					return new Iterator() {
						int i= 0;
						public boolean hasNext() {
							while (i < nl.getLength() && (!(nl.item(i) instanceof Element) || !((Element)nl.item(i)).getTagName().equals(multipleName)))
								i++;
							return i < nl.getLength();
						}
		
						public Object next() {
							if (!hasNext())
								throw new IndexOutOfBoundsException();
							Object obj = nl.item(i++);
							return handleChild((Element) obj);
						}
		
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
				public int size(){
					return nl.getLength();
				}
			});
		}
		for (int i = 0; i < nl.getLength(); i++) {
			Node node = nl.item(i);
			if (node instanceof Element) {
				String name = ((Element)node).getTagName();
				if (!name.equals(multipleName)) {
					initializer.setProperty(name, handleChild((Element) node));
				}
			}
		}		
		initializer.finished();
	}
	protected Object handleChild(Element node) {
			if (node.getAttribute(idRefAttribute).length() > 0)
				return ObjectId.idForObject(this, node.getAttribute(idRefAttribute));
			else if (node.getAttribute(idAttribute).length() > 0) 
				return ObjectId.idForObject(this, node.getAttribute(idAttribute));
			else {
				NodeList childNl = node.getChildNodes();
				if (childNl.getLength() != 1) {
			    	PersistableInitializer initializer = DataSourceHelper.initializeObject();
			    	try {
						mapElement(initializer, node);
					} catch (Exception e) {
						throw new RuntimeException(e);
					}
					return initializer.getInitializingObject();
				}
				else
					return convertStringToObject(node.getFirstChild().getNodeValue());
			}
				

	}
	protected Document doc;

    long nextId;
    protected void checkForDuplicateIds(Set<Integer> usedList, Element element) {
    	String id = element.getAttribute("id");
    	if (id.length() > 0) {
    		int idNum= Integer.parseInt(id);
    		if (idNum >= nextId)
    			nextId= idNum + 1;
    		if (usedList.contains(idNum))
    			throw new RuntimeException("There was a duplicate Id " + id + " found in " + this);
    		usedList.add(idNum);
    	}
    	NodeList nl = element.getChildNodes();
    	for (int i=0; i < nl.getLength(); i++) {
    		if (nl.item(i) instanceof Element) {
    			checkForDuplicateIds(usedList,(Element)nl.item(i));
    		}
    	}
    }
    protected Element getElementById(String id) {
		if (id.equals(""))
			return doc.getDocumentElement();
		else
			return getElementById(doc.getDocumentElement(),id);
    }
    private Element getElementById(Element element, String id) {
        if (element.getAttribute(idAttribute).equals(id))
            return element;
        NodeList nl = element.getChildNodes();
        Element obj;
        for (int i = 0; i < nl.getLength(); i ++) {
            if (nl.item(i) instanceof Element) {
                obj = getElementById((Element) nl.item(i),id);
                if (obj != null)
                    return obj;
            }
        }
        return null;
    }
	public String getUrl() {
		return url;
	}

	class ListInitializerAdapter implements PersistableInitializer{
		Collection list;
		public void finished() {
		}
		public void setLastModified(Date lastModified) {
		}

		public void setVersion(Version version) {
			throw new UnsupportedOperationException("Not implemented yet");
		}

		public Persistable getInitializingObject() {
			return null;
		}

		public void initializeList(Collection list) {
			list = list;
		}

		public void setParent(ObjectId objectToInheritFrom) {
		}

		public void setProperty(String name, Object value, int attributes) {
		}

		public void setProperty(String name, Object value) {
		}
		
	}
	public Collection<Object> query(Query query) throws Exception {
		/*if (query.subObjectId == null || query.subObjectId.equals(""))
			initializer.finished();
		else*/
		ListInitializerAdapter adapter = new ListInitializerAdapter();
		mapObject(adapter, query.subObjectId);
		return adapter.list;
	}


}
