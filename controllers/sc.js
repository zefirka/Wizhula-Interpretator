function Generator(){
	return {
		getNewTid : function(){
			return ( Math.random()*65536 >> 0 ) + "-" + ( Math.random()*65536 >> 0 ) + "-" + ( Math.random()*65536 >> 0 ) + "-" + ( Math.random()*65536 >> 0 );
		}
	}
}

exports.ScopeController = function(){
	var scopes = {
		current : {
			l_name : "global",
			l_id : 0,
			parent : {},
			children : []
		},
		stack : {}
	};

	var _self = {};

	_self.isEmpty = function(scope){
		if(Object.keys(scope).length === 0){
			return true;
		}else{
			return false;
		}
	}

	//возвращает текущий скоуп
	_self.getCurrentScope = function(property){
		if(property){
			return scopes.current[property];
		}else{
			return scopes.current;
		}		
	}

	_self.setCurrentScope = function(x){
		scopes.current = x;
	}

	_self.goToNextScope = function(){
		var tmp = Generator();

		scopes.stack[scopes.current.l_name] = scopes.current;

		_self.setCurrentScope({
			l_name: tmp.getNewTid(),
			l_id: scopes.current.l_id+1,
			parent : { l_name : scopes.current.l_name, l_id : scopes.current.l_id },
			children : []
		});
		console.log("scopes is : \n")
		console.log(scopes);

		console.log("global children: \n");
		console.log(scopes.stack.global.children);
	}

	_self.goToPrevScope = function(){
		scopes.stack[scopes.current.parent.l_name].children.push(scopes.current.l_name);
		scopes.stack[scopes.current.l_name] = scopes.current;

		_self.setCurrentScope({
			l_name: scopes.current.parent.l_name,
			l_id: scopes.current.parent.l_id,
			parent : scopes.stack[scopes.current.parent.l_name].parent === undefined ? {} : scopes.stack[scopes.current.parent.l_name].parent,
			children : scopes.stack[scopes.current.parent.l_name].children,
		});
		console.log(scopes);
	}

	return _self;
}