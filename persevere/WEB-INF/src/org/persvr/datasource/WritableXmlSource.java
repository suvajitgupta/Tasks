package org.persvr.datasource;

import java.util.List;

import org.persvr.data.ObjectId;
import org.persvr.data.Persistable;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
/**
 * This provides an base implementation of writable xml source.  
 * @author Kris
 *
 */
public abstract class WritableXmlSource extends XmlSource implements WritableDataSource,ListDataSource {

	public void recordPropertyAddition(String objectId, String name, Object value, int attributes) throws Exception {
		Element newElement = doc.createElement(name);
		Element element = getElementById(objectId);
		element.appendChild(newElement);
		setValueOnNewElement(newElement, value);
		saveXml();
	}
    public NewObjectPersister recordNewObject(Persistable object) throws Exception {
    	throw new UnsupportedOperationException("not implement yet");
	}

	void setValueOnNewElement(final Element newElement, Object value) {
		if (value instanceof ObjectId) {
			long startMaxId = nextId;
        	((ObjectId)value).persistIfNeeded(new StartAsEmptyPersister() {
        		public ObjectId getParent() {
					return null;
				}
				public Object getAcl() {
					return null;
				}
				public boolean isHiddenId() {
					return false;
				}
				String newObjectId;
				public void start() throws Exception {
					while (getElementById(Long.toString(nextId))!=null)
						nextId++;					
	            	newObjectId =  Long.toString(nextId++);
					newElement.setAttribute(idAttribute, newObjectId);
				}
				public WritableDataSource getSource() {
					return WritableXmlSource.this;
				}
				public String getObjectId() {
					return newObjectId;
				}
        	});
        	if (((ObjectId)value).source == this) {
				if (getElementById(((ObjectId)value).subObjectId) == null) {
					newElement.setAttribute(idAttribute, ((ObjectId)value).subObjectId);
					//((ObjectId)value).getTarget()
				}
				else if (startMaxId == nextId) // indicates it is not newly persisted
					newElement.setAttribute(idRefAttribute, ((ObjectId)value).subObjectId);
				return;
        	}
		}
		newElement.appendChild(doc.createTextNode(convertObjectToString(value)));		
		
	}
	void clearElement() {
		
	}
	void setValueOnOldElement(Element element, Object value) {
		if (value instanceof ObjectId && ((ObjectId)value).source == this) {
			if (getElementById(((ObjectId)value).subObjectId) == null)
				element.setAttribute(idAttribute, ((ObjectId)value).subObjectId);
			else
				element.setAttribute(idRefAttribute, ((ObjectId)value).subObjectId);
			if (element.getFirstChild() != null)
				element.removeChild(element.getFirstChild());
		}
		else	{
			element.removeAttribute(idRefAttribute);
			element.removeAttribute(idAttribute);
			if (element.getFirstChild() == null)
				element.appendChild(doc.createTextNode(convertObjectToString(value)));
			else
				element.replaceChild(doc.createTextNode(convertObjectToString(value)),element.getFirstChild());
		}
		
	}
	public void recordPropertyChange(String objectId, String name, Object value, int attributes) throws Exception {
		Element element = getElementById(objectId);
		final NodeList nl = element.getChildNodes();
		for (int i = 0; i < nl.getLength(); i++) {
			Node node = nl.item(i);
			if (node instanceof Element) {
				String tagName= ((Element)node).getTagName();
				if (name.equals(tagName)) {
					setValueOnOldElement((Element) node, value);
					break;
				}
			}			
		}
		saveXml();
	}

	public void recordPropertyRemoval(String objectId, String name) throws Exception {
		Element element = getElementById(objectId);
		final NodeList nl = element.getChildNodes();
		for (int i = 0; i < nl.getLength(); i++) {
			Node node = nl.item(i);
			if (node instanceof Element) {
				String tagName= ((Element)node).getTagName();
				if (name.equals(tagName)) {
					element.removeChild(node);
					break;
				}
			}
		}		
		saveXml();

	}
	public void recordList(String objectId, List<? extends Object> values) throws Exception {
		Element element = getElementById(objectId);
		String multipleName = findMultipleTag(element);
		NodeList nl = element.getChildNodes();
		for (int i = 0; i < nl.getLength(); i++) {
			Node node = nl.item(i);
			if (node instanceof Element && ((Element)node).getTagName().equals(multipleName)) {
				element.removeChild(node);
				i--;
			}
		}
		for (Object value : values){
			Element newChild = (Element) element.appendChild(doc.createElement(multipleName));
			setValueOnNewElement(newChild,value);
		}
		saveXml();
	}

    long nextId;
    protected abstract void saveXml();
	public void recordDelete(String objectId) throws Exception {
		Element element = getElementById(objectId);
		element.getParentNode().removeChild(element);
		saveXml();
	}

	public void abortTransaction() throws Exception {
		
	}
	public void commitTransaction() throws Exception {
		//TODO: Move saveXml to here
	}
	public void startTransaction() throws Exception {
		
	}

}
