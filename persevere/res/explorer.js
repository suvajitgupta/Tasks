dojo.addOnLoad(startExplorer);
dojo.require("dojox.json.schema");
dojo.require("dojox.data.ClientFilter");
dojo.require("dojox.data.PersevereStore");
dojo.require("dojox.data.StoreExplorer");


function startExplorer(){
		startExplorer = function(){}; // just run it once
		var plainXhr = dojo.xhr;
		var currentRequests = 0;
		username = undefined;
		var addSigninButton;
		dojo.xhr = function(method,args,hasBody) {
			if(!args.noStatus){
				currentRequests++;
				var statusElement = dojo.byId("status");
				if(statusElement){
					dojo.style(statusElement,"display","block");
					dojo.style(dojo.body(),"cursor","progress");
					statusElement.innerHTML = method == "GET" ? "Loading" : "Processing";
				}
				function done(res) {
					username = dfd.ioArgs.xhr.getResponseHeader("Username");
					// if the sign-in button is waiting for us
					if(addSigninButton){
						addSigninButton();
						addSigninButton = null;
					}
					if(!--currentRequests){
						if(statusElement){
							dojo.style(statusElement,"display","none");
							dojo.style(dojo.body(),"cursor","auto");
						}
					}
					return res;
				}
				try {
					(args.headers = args.headers || {})['Include-ToString-Source'] = true;
					args.headers['Server-Methods'] = true;
					var dfd = plainXhr(method,args,hasBody);
					dfd.addBoth(done);
				}
				catch(e){
					done();
				}
			}else{
				dfd = plainXhr(method,args,hasBody);
			}			
			return dfd;
		}
		var path = location.pathname.match(/(.*\/)[^\/]*$/)[1];
		var storesDfd = dojox.data.PersevereStore.getStores(path); // persevere stores are auto-generated
		storesDfd.addErrback(function(e){
			alert("Could not load Persevere classes (Class table)." + (/404/.test(e.message) ? " Are you sure you are connected to Persevere and not just a generic web server like Apache?" : ""));
		});
		var cp = new dijit.layout.ContentPane({
            id: 'storeExplorer',
            region: 'center',
            style: "overflow:hidden"
        }).placeAt(dijit.byId("explorerSection"));
        var explorer = new dojox.data.StoreExplorer({
			style:"height:100%;width:100%;border:1px solid black", 
			stringQueries: true
		});
        cp.attr("content", explorer);
		var defaultChildren = explorer.tree.model.getChildren;
		explorer.tree.model.getChildren = function(parentModelNode, onComplete){
			var item = parentModelNode.value;
			if(((item.$ref || item.__id) + '').match(/\/$/)){
				console.log("Please view the contents of this query by selecting the class in the explorer");
				onComplete([]);
				return;
			}
			defaultChildren.apply(null,arguments);
		}
		var defaultCreateNew = explorer.createNew;
		explorer.createNew = function(){
			if(activeClassName == 'Class'){
				// special handling for classes
				var tableName = prompt("What would you like to name your new table/class?","");
				if (!tableName)
					return;
				var superType = prompt("What table/class would you like to extend from (usually you want Object)?","Object");
				if (!superType)
					return;
			    dojo.rawXhrPost({
			    	url: "Class/",
			    	sync: true,
			    	postData: dojo.toJson({id:tableName, "extends":{$ref:"../Class/" + superType}})
			    });
				location.reload();
			}else if(activeClassName == 'User'){
				// special handling for users
				dojo.require("persevere.Login");
			    var login = new persevere.Login({onLoginSuccess: function(){}});
			    login._showLogin = function(){};// do nothing when it tries to show the login
			    dojo.body().appendChild(login.domNode);
			    login._showRegister();

			}else if(activeClassName == 'File'){
				var fileDialog = this._fileDialog;
				if(fileDialog){
					fileDialog.reset();
				}
				else{
					var uploadForm; 
					onFileSelected = function(){
						var uploadFrame = dojo.query("iframe", fileDialog.domNode)[0];
						uploadFrame.onload = function(){
							explorer.grid._refresh();
						}
						uploadForm.submit();
						dojo.query("span", fileDialog.domNode)[0].innerHTML = "Loading file..."; 
						uploadForm.innerHTML = "";
						fileDialog.hide();
					};
					this._fileDialog = fileDialog = new dijit.Dialog({
						title: "Upload File",
						preload: true,
						content:'File Dialog'			   
					});
					
					fileDialog.placeAt(dojo.body());  
					fileDialog.startup();
			
				}
				fileDialog.domNode.innerHTML = '<span>Choose a file to upload</span> <form action="File" method="POST" enctype="multipart/form-data" target="uploadTarget"><input type="file" name="file" onchange="onFileSelected()"></input></form><iframe name="uploadTarget" style="display:none"></iframe>';
				fileDialog.show();
				uploadForm = dojo.query("form", fileDialog.domNode)[0];
			}
			else{
				defaultCreateNew.call(explorer);
			}
		}
		dojo.byId("queryText").innerHTML = '<a href="#jsonpath" onclick="navigateTo(\'jsonpath\')" title="Enter a JSONQuery like [?name=\'foo\']">JSONQuery</a>:';
		dojo.byId("queryTextBox").title="Enter a JSONQuery like [?name=\'foo\']";
		var controlsArea = dojo.byId("queryText").parentNode; 
		function addButton(name, action){
			var button = new dijit.form.Button({label: name}).placeAt(controlsArea);
			button.onClick = action;
			return button;
		}
		addButton("Grant Access",function(){
			//TODO: Maybe have two options, one for a 
			var selectedItem = explorer.grid.selection.getSelected()[0];
			var username = prompt("Who would you like to grant access to?","public");
			if(username){
				var accessLevel = prompt("What access level would you like to grant (none, limited, read, execute, append, write, or full)?","full");
				if(accessLevel){	
					dojo.rawXhrPost({
						url: "Class/User",
						postData: dojox.json.ref.toJson({
							method:"grantAccess",
							params:[username, selectedItem || {__id:activeStore.target + '/'}, accessLevel],
							id:'' + Math.random()
						})
					});
				}
			}
		});
		function createSignInButton(){
			//creates the signin/signout button, now or later
			if(username){
				addButton("Sign-out",function(){
					if(confirm("Are you sure you want to sign out?")){
					    dojo.xhrPost({
							url: "Class/User",
							postData: dojo.toJson({method: "authenticate", id:"login", params:[null,null]}),
							handleAs: "json"
					    }).addCallback(function(){
					    	location.reload();
					    });
					}
				});
			}else{
				addButton("Sign-in",function(){
					dojo.require("persevere.Login");
				    var login = new persevere.Login({onLoginSuccess: function(){
				    	location.reload();
				    }});
				    dojo.body().appendChild(login.domNode);
				    login.startup();
				});			
			}
		}
		if(typeof username == 'undefined'){
			// not ready yet
			addSigninButton = createSignInButton;
		}else{
			createSignInButton();
		}
		function showTable(className){
			//dojo.byId("addItem").innerHTML = "<img src='res/add.png' />New " + className;
			//dojo.byId("removeItem").innerHTML = "Delete " + className;
			//dojo.byId("query").value = "";
			activeClassName = className;
			explorer.setItemName(className);
			explorer.setStore(activeStore = persevereStores[className]);
		}
		dojo.addOnLoad(function(){
			storesDfd.addCallback(function(stores){
				persevereStores = stores;
				var classes = dojo.byId("classes");
				for(i in persevereStores){
					var classOption = classes.appendChild(document.createElement("option"));
					classOption.innerHTML = i;
					classOption.value = i;
				}
				classes.value = "Class";
				dojo.connect(classes,"change",function(){
					showTable(classes.value);
				});
				showTable("Class");
			});
		});
		
}

