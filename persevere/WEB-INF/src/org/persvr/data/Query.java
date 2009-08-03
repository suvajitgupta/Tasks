package org.persvr.data;

import java.util.ArrayList;
import java.util.List;

import org.mozilla.javascript.CompilerEnvirons;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Node;
import org.mozilla.javascript.Parser;
import org.mozilla.javascript.ScriptOrFnNode;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Token;
import org.persvr.javascript.PersevereContextFactory;


/**
 * This represents a query that is generated from a JSONPath expression and is passed to 
 * data sources for efficient query execution at the data source level.
 * @author Kris
 *
 */
public class Query extends ObjectId {
	@Override
	public Persistable getTarget() {
		// queries are non-cacheable
		return resolveTarget();
	}
	public Persistable getCachedTarget(){
		return super.getTarget();
	}
	public boolean hidden(){
		return false;
	}
	public Function conditionFunction;
	private static CompilerEnvirons compilerEnvirons = new CompilerEnvirons();
	static Query parseQuery(Query oldQuery, final Scriptable scope, Function queryFunction, boolean condition, boolean ascending) {
		String queryStr = (String) ((Function) ScriptableObject.getProperty(queryFunction,"toString")).call(PersevereContextFactory.getContext(), scope , queryFunction, new Object[]{});
		Object params = scope.get("args",scope);
		Scriptable parameters = (Scriptable) (params instanceof Scriptable ? params : null); 

		Query newQuery = new Query();
		if(condition)
			newQuery.conditionFunction = queryFunction;
		newQuery.source = oldQuery.source;
		newQuery.subObjectId = oldQuery.subObjectId;
		Parser p = new Parser(compilerEnvirons, compilerEnvirons.getErrorReporter());
        ScriptOrFnNode tree;
        tree = p.parse("(" + queryStr + ")", "jsonpath-sub-expression", 0);
        Node functionBody = tree.getFunctionNode(0).getFirstChild();
        Node returnNode = functionBody.getFirstChild();
        if(returnNode.getType() != Token.RETURN){
        	returnNode = returnNode.getFirstChild().getFirstChild().getFirstChild();
        }
        Node queryNode = returnNode.getFirstChild();
        replaceStrings(queryNode, returnNode, parameters);
        if(condition){
        	if(oldQuery.condition == null)
        		newQuery.condition = queryNode;
        	else{
        		Node andNode = new Node(Token.AND);
        		andNode.addChildToBack(oldQuery.condition);
        		andNode.addChildToBack(queryNode);
        		newQuery.condition = andNode;
        	}
        }
        else {
        	newQuery.condition = oldQuery.condition;
        	newQuery.sort = new ArrayList();
        	SortDirective sortDirective = new SortDirective();
        	newQuery.sort.add(sortDirective);
        	sortDirective.ascending = ascending;
        	sortDirective.expression = queryNode; 
        }
		return newQuery;
	}
	static void replaceStrings(Node node, Node parent, Scriptable parameters) {
		if (node.getType() == Token.CALL) {
			Node caller = node.getFirstChild();
		}
		if (node.getType() == Token.NAME && ("$obj".equals(node.getString()) || "$obj".equals(node.getString()))) {
			node.setType(Token.THIS);
		}
		if (node.getType() == Token.GETPROP && node.getFirstChild().getType() == Token.NAME &&
				"args".equals(node.getFirstChild().getString()) && node.getLastChild().getType() == Token.STRING && 
				node.getLastChild().getString().startsWith("param")) {
			Object value = parameters.get(node.getLastChild().getString(),parameters);
			if (value instanceof String) {
				parent.replaceChild(node,Node.newString((String) value));
			}
			else if (value instanceof Number) {
				parent.replaceChild(node,Node.newNumber(((Number) value).doubleValue()));
			}
			else if (value instanceof Persistable) {
				node.setType(Token.EQ);
				while(node.getFirstChild() != null)
					node.removeChild(node.getFirstChild());
				node.addChildToFront(new Node(Token.DOT,new Node(Token.THIS),new Node(Token.NAME)));
				node.addChildToFront(new Node(Token.STRING));
				node.getFirstChild().getLastChild().setString("id");
				node.getLastChild().setString(((Persistable)value).getId().subObjectId);
			}
			//TODO: Do the rest of these
		}
		parent = node;
		node = node.getFirstChild();
		while (node!= null){
			replaceStrings(node,parent,parameters);
			node=node.getNext();
		};
	}
	Node condition;
	public static class SortDirective {
		public Node expression;
		public boolean ascending;
	}
	List<SortDirective> sort;
	public Node getCondition() {
		return condition;
	}
	public List<SortDirective> getSort() {
		return sort;
	}
}
