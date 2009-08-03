/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

/*
	This is a compiled version of Dojo, built for deployment and not for
	development. To get an editable version, please visit:

		http://dojotoolkit.org

	for documentation and information on getting the source.
*/

if(!dojo._hasResource["dojo.date.stamp"]){dojo._hasResource["dojo.date.stamp"]=true;dojo.provide("dojo.date.stamp");dojo.date.stamp.fromISOString=function(_1,_2){if(!dojo.date.stamp._isoRegExp){dojo.date.stamp._isoRegExp=/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;}var _3=dojo.date.stamp._isoRegExp.exec(_1);var _4=null;if(_3){_3.shift();if(_3[1]){_3[1]--;}if(_3[6]){_3[6]*=1000;}if(_2){_2=new Date(_2);dojo.map(["FullYear","Month","Date","Hours","Minutes","Seconds","Milliseconds"],function(_5){return _2["get"+_5]();}).forEach(function(_6,_7){if(_3[_7]===undefined){_3[_7]=_6;}});}_4=new Date(_3[0]||1970,_3[1]||0,_3[2]||1,_3[3]||0,_3[4]||0,_3[5]||0,_3[6]||0);var _8=0;var _9=_3[7]&&_3[7].charAt(0);if(_9!="Z"){_8=((_3[8]||0)*60)+(Number(_3[9])||0);if(_9!="-"){_8*=-1;}}if(_9){_8-=_4.getTimezoneOffset();}if(_8){_4.setTime(_4.getTime()+_8*60000);}}return _4;};dojo.date.stamp.toISOString=function(_a,_b){var _c=function(n){return (n<10)?"0"+n:n;};_b=_b||{};var _d=[];var _e=_b.zulu?"getUTC":"get";var _f="";if(_b.selector!="time"){var _10=_a[_e+"FullYear"]();_f=["0000".substr((_10+"").length)+_10,_c(_a[_e+"Month"]()+1),_c(_a[_e+"Date"]())].join("-");}_d.push(_f);if(_b.selector!="date"){var _11=[_c(_a[_e+"Hours"]()),_c(_a[_e+"Minutes"]()),_c(_a[_e+"Seconds"]())].join(":");var _12=_a[_e+"Milliseconds"]();if(_b.milliseconds){_11+="."+(_12<100?"0":"")+_c(_12);}if(_b.zulu){_11+="Z";}else{if(_b.selector!="time"){var _13=_a.getTimezoneOffset();var _14=Math.abs(_13);_11+=(_13>0?"-":"+")+_c(Math.floor(_14/60))+":"+_c(_14%60);}}_d.push(_11);}return _d.join("T");};}if(!dojo._hasResource["dojox.json.ref"]){dojo._hasResource["dojox.json.ref"]=true;dojo.provide("dojox.json.ref");dojox.json.ref={resolveJson:function(_15,_16){_16=_16||{};var _17=_16.idAttribute||"id";var _18=this.refAttribute;var _19=_16.idPrefix||"";var _1a=_16.assignAbsoluteIds;var _1b=_16.index||{};var _1c=_16.timeStamps;var ref,_1d=[];var _1e=/^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/;var _1f=this._addProp;var F=function(){};function _20(it,_21,_22,_23,_24,_25){var i,_26,val,id=_17 in it?it[_17]:_22;if(_17 in it||((id!==undefined)&&_23)){id=(_19+id).replace(_1e,"$2$3");}var _27=_25||it;if(id!==undefined){if(_1a){it.__id=id;}if(_16.schemas&&(!(it instanceof Array))&&(val=id.match(/^(.+\/)[^\.\[]*$/))){_24=_16.schemas[val[1]];}if(_1b[id]&&((it instanceof Array)==(_1b[id] instanceof Array))){_27=_1b[id];delete _27.$ref;delete _27._loadObject;_26=true;}else{var _28=_24&&_24.prototype;if(_28){F.prototype=_28;_27=new F();}}_1b[id]=_27;if(_1c){_1c[id]=_16.time;}}while(_24){var _29=_24.properties;if(_29){for(i in it){var _2a=_29[i];if(_2a&&_2a.format=="date-time"&&typeof it[i]=="string"){it[i]=dojo.date.stamp.fromISOString(it[i]);}}}_24=_24["extends"];}var _2b=it.length;for(i in it){if(i==_2b){break;}if(it.hasOwnProperty(i)){val=it[i];if((typeof val=="object")&&val&&!(val instanceof Date)&&i!="__parent"){ref=val[_18];if(!ref||!val.__parent){val.__parent=it;}if(ref){delete it[i];var _2c=ref.toString().replace(/(#)([^\.\[])/,"$1.$2").match(/(^([^\[]*\/)?[^#\.\[]*)#?([\.\[].*)?/);if((ref=(_2c[1]=="$"||_2c[1]=="this"||_2c[1]=="")?_15:_1b[(_19+_2c[1]).replace(_1e,"$2$3")])){if(_2c[3]){_2c[3].replace(/(\[([^\]]+)\])|(\.?([^\.\[]+))/g,function(t,a,b,c,d){ref=ref&&ref[b?b.replace(/[\"\'\\]/,""):d];});}}if(ref){val=ref;}else{if(!_21){var _2d;if(!_2d){_1d.push(_27);}_2d=true;val=_20(val,false,val[_18],true,_2a);val._loadObject=_16.loader;}}}else{if(!_21){val=_20(val,_1d==it,id===undefined?undefined:_1f(id,i),false,_2a,_27!=it&&typeof _27[i]=="object"&&_27[i]);}}}it[i]=val;if(_27!=it&&!_27.__isDirty){var old=_27[i];_27[i]=val;if(_26&&val!==old&&!_27._loadObject&&!(i.charAt(0)=="_"&&i.charAt(1)=="_")&&i!="$ref"&&!(val instanceof Date&&old instanceof Date&&val.getTime()==old.getTime())&&!(typeof val=="function"&&typeof old=="function"&&val.toString()==old.toString())&&_1b.onUpdate){_1b.onUpdate(_27,i,old,val);}}}}if(_26&&(_17 in it)){for(i in _27){if(!_27.__isDirty&&_27.hasOwnProperty(i)&&!it.hasOwnProperty(i)&&!(i.charAt(0)=="_"&&i.charAt(1)=="_")&&!(_27 instanceof Array&&isNaN(i))){if(_1b.onUpdate&&i!="_loadObject"&&i!="_idAttr"){_1b.onUpdate(_27,i,_27[i],undefined);}delete _27[i];while(_27 instanceof Array&&_27.length&&_27[_27.length-1]===undefined){_27.length--;}}}}else{if(_1b.onLoad){_1b.onLoad(_27);}}return _27;};if(_15&&typeof _15=="object"){_15=_20(_15,false,_16.defaultId,true);_20(_1d,false);}return _15;},fromJson:function(str,_2e){function ref(_2f){var _30={};_30[this.refAttribute]=_2f;return _30;};try{var _31=eval("("+str+")");}catch(e){throw new SyntaxError("Invalid JSON string: "+e.message+" parsing: "+str);}if(_31){return this.resolveJson(_31,_2e);}return _31;},toJson:function(it,_32,_33,_34){var _35=this._useRefs;var _36=this._addProp;var _37=this.refAttribute;_33=_33||"";var _38={};var _39={};function _3a(it,_3b,_3c){if(typeof it=="object"&&it){var _3d;if(it instanceof Date){return "\""+dojo.date.stamp.toISOString(it,{zulu:true})+"\"";}var id=it.__id;if(id){if(_3b!="#"&&((_35&&!id.match(/#/))||_38[id])){var ref=id;if(id.charAt(0)!="#"){if(it.__clientId==id){ref="cid:"+id;}else{if(id.substring(0,_33.length)==_33){ref=id.substring(_33.length);}else{ref=id;}}}var _3e={};_3e[_37]=ref;return _3a(_3e,"#");}_3b=id;}else{it.__id=_3b;_39[_3b]=it;}_38[_3b]=it;_3c=_3c||"";var _3f=_32?_3c+dojo.toJsonIndentStr:"";var _40=_32?"\n":"";var sep=_32?" ":"";if(it instanceof Array){var res=dojo.map(it,function(obj,i){var val=_3a(obj,_36(_3b,i),_3f);if(typeof val!="string"){val="undefined";}return _40+_3f+val;});return "["+res.join(","+sep)+_40+_3c+"]";}var _41=[];for(var i in it){if(it.hasOwnProperty(i)){var _42;if(typeof i=="number"){_42="\""+i+"\"";}else{if(typeof i=="string"&&(i.charAt(0)!="_"||i.charAt(1)!="_")){_42=dojo._escapeString(i);}else{continue;}}var val=_3a(it[i],_36(_3b,i),_3f);if(typeof val!="string"){continue;}_41.push(_40+_3f+_42+":"+sep+val);}}return "{"+_41.join(","+sep)+_40+_3c+"}";}else{if(typeof it=="function"&&dojox.json.ref.serializeFunctions){return it.toString();}}return dojo.toJson(it);};var _43=_3a(it,"#","");if(!_34){for(var i in _39){delete _39[i].__id;}}return _43;},_addProp:function(id,_44){return id+(id.match(/#/)?id.length==1?"":".":"#")+_44;},refAttribute:"$ref",_useRefs:false,serializeFunctions:false};}if(!dojo._hasResource["dojox.rpc.Rest"]){dojo._hasResource["dojox.rpc.Rest"]=true;dojo.provide("dojox.rpc.Rest");(function(){if(dojox.rpc&&dojox.rpc.transportRegistry){dojox.rpc.transportRegistry.register("REST",function(str){return str=="REST";},{getExecutor:function(_45,_46,svc){return new dojox.rpc.Rest(_46.name,(_46.contentType||svc._smd.contentType||"").match(/json|javascript/),null,function(id,_47){var _48=svc._getRequest(_46,[id]);_48.url=_48.target+(_48.data?"?"+_48.data:"");return _48;});}});}var drr;function _49(_4a,_4b,_4c,id){_4a.addCallback(function(_4d){if(_4c){_4c=_4a.ioArgs.xhr&&_4a.ioArgs.xhr.getResponseHeader("Content-Range");_4a.fullLength=_4c&&(_4c=_4c.match(/\/(.*)/))&&parseInt(_4c[1]);}return _4d;});return _4a;};drr=dojox.rpc.Rest=function(_4e,_4f,_50,_51){var _52;_52=function(id,_53){return drr._get(_52,id,_53);};_52.isJson=_4f;_52._schema=_50;_52.cache={serialize:_4f?((dojox.json&&dojox.json.ref)||dojo).toJson:function(_54){return _54;}};_52._getRequest=_51||function(id,_55){if(dojo.isObject(id)){var _56=_55.sort&&_55.sort[0];if(_56&&_56.attribute){id.sort=(_56.descending?"-":"")+_56.attribute;}id=dojo.objectToQuery(id);id=id?"?"+id:"";}var _57={url:_4e+(id==null?"":id),handleAs:_4f?"json":"text",contentType:_4f?"application/json":"text/plain",sync:dojox.rpc._sync,headers:{Accept:_4f?"application/json,application/javascript":"*/*"}};if(_55&&(_55.start>=0||_55.count>=0)){_57.headers.Range="items="+(_55.start||"0")+"-"+((_55.count&&_55.count!=Infinity&&(_55.count+(_55.start||0)-1))||"");}dojox.rpc._sync=false;return _57;};function _58(_59){_52[_59]=function(id,_5a){return drr._change(_59,_52,id,_5a);};};_58("put");_58("post");_58("delete");_52.servicePath=_4e;return _52;};drr._index={};drr._timeStamps={};drr._change=function(_5b,_5c,id,_5d){var _5e=_5c._getRequest(id);_5e[_5b+"Data"]=_5d;return _49(dojo.xhr(_5b.toUpperCase(),_5e,true),_5c);};drr._get=function(_5f,id,_60){_60=_60||{};return _49(dojo.xhrGet(_5f._getRequest(id,_60)),_5f,(_60.start>=0||_60.count>=0),id);};})();}if(!dojo._hasResource["dojox.rpc.JsonRest"]){dojo._hasResource["dojox.rpc.JsonRest"]=true;dojo.provide("dojox.rpc.JsonRest");(function(){var _61=[];var _62=dojox.rpc.Rest;var jr;function _63(_64,_65,_66,_67){var _68=_65.ioArgs&&_65.ioArgs.xhr&&_65.ioArgs.xhr.getResponseHeader("Last-Modified");if(_68&&_62._timeStamps){_62._timeStamps[_67]=_68;}return _66&&dojox.json.ref.resolveJson(_66,{defaultId:_67,index:_62._index,timeStamps:_68&&_62._timeStamps,time:_68,idPrefix:_64.servicePath.replace(/[^\/]*$/,""),idAttribute:jr.getIdAttribute(_64),schemas:jr.schemas,loader:jr._loader,assignAbsoluteIds:true});};jr=dojox.rpc.JsonRest={serviceClass:dojox.rpc.Rest,conflictDateHeader:"If-Unmodified-Since",commit:function(_69){_69=_69||{};var _6a=[];var _6b={};var _6c=[];for(var i=0;i<_61.length;i++){var _6d=_61[i];var _6e=_6d.object;var old=_6d.old;var _6f=false;if(!(_69.service&&(_6e||old)&&(_6e||old).__id.indexOf(_69.service.servicePath))&&_6d.save){delete _6e.__isDirty;if(_6e){if(old){var _70;if((_70=_6e.__id.match(/(.*)#.*/))){_6e=_62._index[_70[1]];}if(!(_6e.__id in _6b)){_6b[_6e.__id]=_6e;_6a.push({method:"put",target:_6e,content:_6e});}}else{_6a.push({method:"post",target:{__id:jr.getServiceAndId(_6e.__id).service.servicePath},content:_6e});}}else{if(old){_6a.push({method:"delete",target:old});}}_6c.push(_6d);_61.splice(i--,1);}}dojo.connect(_69,"onError",function(){var _71=_61;_61=_6c;var _72=0;jr.revert();_61=_71;});jr.sendToServer(_6a,_69);return _6a;},sendToServer:function(_73,_74){var _75;var _76=dojo.xhr;var _77=_73.length;var i,_78;var _79;var _7a=this.conflictDateHeader;dojo.xhr=function(_7b,_7c){_7c.headers=_7c.headers||{};_7c.headers["Transaction"]=_73.length-1==i?"commit":"open";if(_7a&&_79){_7c.headers[_7a]=_79;}if(_78){_7c.headers["Content-ID"]="<"+_78+">";}return _76.apply(dojo,arguments);};for(i=0;i<_73.length;i++){var _7d=_73[i];dojox.rpc.JsonRest._contentId=_7d.content&&_7d.content.__id;var _7e=_7d.method=="post";_79=_7d.method=="put"&&_62._timeStamps[_7d.content.__id];if(_79){_62._timeStamps[_7d.content.__id]=(new Date())+"";}_78=_7e&&dojox.rpc.JsonRest._contentId;var _7f=jr.getServiceAndId(_7d.target.__id);var _80=_7f.service;var dfd=_7d.deferred=_80[_7d.method](_7f.id.replace(/#/,""),dojox.json.ref.toJson(_7d.content,false,_80.servicePath,true));(function(_81,dfd,_82){dfd.addCallback(function(_83){try{var _84=dfd.ioArgs.xhr&&dfd.ioArgs.xhr.getResponseHeader("Location");if(_84){var _85=_84.match(/(^\w+:\/\/)/)&&_84.indexOf(_82.servicePath);_84=_85>0?_84.substring(_85):(_82.servicePath+_84).replace(/^(.*\/)?(\w+:\/\/)|[^\/\.]+\/\.\.\/|^.*\/(\/)/,"$2$3");_81.__id=_84;_62._index[_84]=_81;}_83=_63(_82,dfd,_83,_81&&_81.__id);}catch(e){}if(!(--_77)){if(_74.onComplete){_74.onComplete.call(_74.scope);}}return _83;});})(_7d.content,dfd,_80);dfd.addErrback(function(_86){_77=-1;_74.onError.call(_74.scope,_86);});}dojo.xhr=_76;},getDirtyObjects:function(){return _61;},revert:function(_87){for(var i=_61.length;i>0;){i--;var _88=_61[i];var _89=_88.object;var old=_88.old;if(!(_87&&(_89||old)&&(_89||old).__id.indexOf(_87.servicePath))){if(_89&&old){for(var j in old){if(old.hasOwnProperty(j)){_89[j]=old[j];}}for(j in _89){if(!old.hasOwnProperty(j)){delete _89[j];}}}delete (_89||old).__isDirty;_61.splice(i,1);}}},changing:function(_8a,_8b){if(!_8a.__id){return;}_8a.__isDirty=true;for(var i=0;i<_61.length;i++){var _8c=_61[i];if(_8a==_8c.object){if(_8b){_8c.object=false;if(!this._saveNotNeeded){_8c.save=true;}}return;}}var old=_8a instanceof Array?[]:{};for(i in _8a){if(_8a.hasOwnProperty(i)){old[i]=_8a[i];}}_61.push({object:!_8b&&_8a,old:old,save:!this._saveNotNeeded});},deleteObject:function(_8d){this.changing(_8d,true);},getConstructor:function(_8e,_8f){if(typeof _8e=="string"){var _90=_8e;_8e=new dojox.rpc.Rest(_8e,true);this.registerService(_8e,_90,_8f);}if(_8e._constructor){return _8e._constructor;}_8e._constructor=function(_91){var _92=this;var _93=arguments;var _94;var _95;function _96(_97){if(_97){_96(_97["extends"]);_94=_97.properties;for(var i in _94){var _98=_94[i];if(_98&&(typeof _98=="object")&&("default" in _98)){_92[i]=_98["default"];}}}if(_97&&_97.prototype&&_97.prototype.initialize){_95=true;_97.prototype.initialize.apply(_92,_93);}};_96(_8e._schema);if(!_95&&_91&&typeof _91=="object"){dojo.mixin(_92,_91);}var _99=jr.getIdAttribute(_8e);_62._index[this.__id=this.__clientId=_8e.servicePath+(this[_99]||Math.random().toString(16).substring(2,14)+"@"+((dojox.rpc.Client&&dojox.rpc.Client.clientId)||"client"))]=this;if(dojox.json.schema&&_94){dojox.json.schema.mustBeValid(dojox.json.schema.validate(this,_8e._schema));}_61.push({object:this,save:true});};return dojo.mixin(_8e._constructor,_8e._schema,{load:_8e});},fetch:function(_9a){var _9b=jr.getServiceAndId(_9a);return this.byId(_9b.service,_9b.id);},getIdAttribute:function(_9c){var _9d=_9c._schema;var _9e;if(_9d){if(!(_9e=_9d._idAttr)){for(var i in _9d.properties){if(_9d.properties[i].identity){_9d._idAttr=_9e=i;}}}}return _9e||"id";},getServiceAndId:function(_9f){var _a0="";for(var _a1 in jr.services){if((_9f.substring(0,_a1.length)==_a1)&&(_a1.length>=_a0.length)){_a0=_a1;}}if(_a0){return {service:jr.services[_a0],id:_9f.substring(_a0.length)};}var _a2=_9f.match(/^(.*\/)([^\/]*)$/);return {service:new jr.serviceClass(_a2[1],true),id:_a2[2]};},services:{},schemas:{},registerService:function(_a3,_a4,_a5){_a4=_a3.servicePath=_a4||_a3.servicePath;_a3._schema=jr.schemas[_a4]=_a5||_a3._schema||{};jr.services[_a4]=_a3;},byId:function(_a6,id){var _a7,_a8=_62._index[(_a6.servicePath||"")+id];if(_a8&&!_a8._loadObject){_a7=new dojo.Deferred();_a7.callback(_a8);return _a7;}return this.query(_a6,id);},query:function(_a9,id,_aa){var _ab=_a9(id,_aa);_ab.addCallback(function(_ac){if(_ac.nodeType&&_ac.cloneNode){return _ac;}return _63(_a9,_ab,_ac,typeof id!="string"||(_aa&&(_aa.start||_aa.count))?undefined:id);});return _ab;},_loader:function(_ad){var _ae=jr.getServiceAndId(this.__id);var _af=this;jr.query(_ae.service,_ae.id).addBoth(function(_b0){if(_b0==_af){delete _b0.$ref;delete _b0._loadObject;}else{_af._loadObject=function(_b1){_b1(_b0);};}_ad(_b0);});},isDirty:function(_b2){if(!_b2){return !!_61.length;}return _b2.__isDirty;}};})();}if(!dojo._hasResource["persevere.persevere"]){dojo._hasResource["persevere.persevere"]=true;dojo.provide("persevere.persevere");(function(){var jr=dojox.rpc.JsonRest;var _b3=null;var _b4=dojo.xhr;dojo.xhr=function(_b5,_b6,_b7){function _b8(res){_b3=dfd.ioArgs.xhr.getResponseHeader("Username");};dfd=_b4(_b5,_b6,_b7);return dfd;};function _b9(_ba,_bb){_ba._loadObject(function(_bc){delete _ba._loadObject;_bb(_bc);});};pjs={commit:function(_bd){jr.commit({onComplete:_bd});},rollback:jr.revert,changing:jr.changing,get:function(_be,_bf,_c0){var _c1=_be[_bf];if(_c0){if(_c1&&_c1._loadObject){_b9(_c1,_c0);}else{_c0(_c1);}}return _c1;},set:function(_c2,_c3,_c4){jr.changing(_c2);_c2[_c3]=_c4;},getId:function(_c5){return _c5.__id;},load:function(id,_c6){if(id.match(/[^\/\w]|(\/$)/)){delete dojox.rpc.Rest._index[id];}jr.fetch(id).addBoth(function(_c7){_c6(_c7);return _c7;});},remove:function(_c8){jr.deleteObject(_c8);},isPersisted:function(_c9){return !!_c9.__id;},getUserName:function(){return _b3;},loadClasses:function(_ca,_cb,_cc){_ca=(_ca&&(_ca.match(/\/$/)?_ca:(_ca+"/")))||"/";if(_ca.match(/^\w*:\/\//)){dojox.io.xhrWindowNamePlugin(_ca,dojox.io.xhrPlugins.fullHttpAdapter,true);}var _cd=dojox.rpc.Rest(_ca,true);var _ce=dojox.rpc._sync;dojox.rpc._sync=!_cb;var dfd=_cd("root");var _cf;_cc=_cc||window;dfd.addBoth(function(_d0){for(var i in _d0){if(typeof _d0[i]=="object"){_cc[i]=_d0[i]=dojox.rpc.JsonRest.getConstructor(new dojo._Url(_ca,i)+"",_d0[i]);}}return (_cf=_d0);});dojox.rpc._sync=_ce;return _cb?dfd.addBoth(_cb):_cf;}};})();}
