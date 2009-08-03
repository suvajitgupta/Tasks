package org.persvr.data;

import java.util.List;

public interface PropertyChangeSetListener extends java.util.EventListener{
    /**
     * This method gets called when bound properties are changed.
     * @param evt A PropertyChangeEvent object describing the event source 
     *   	and the property that has changed.
     */
    void propertyChange(List<ObservedCall> evt);
  //TODO: This should be changed to just be an object event
}
