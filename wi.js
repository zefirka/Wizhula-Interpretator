exports.wi = function(s){
	var Rnd = Generator();
	var Err = ErrorController(); 
	var Scope = ScopeController();

	var stack = {
		vx : {}, //value type register
	};

	
	var cells = {},
			cCount = 0,
		 	currentCellID = "global";
	
	var state = "main";
	
	var line = 0 , character = 1;

	function getOut(){
		if(currentCellID=="global"){
			Err.errlog(line, character);
		}else{
			var cur = cells["cell_" + currentCellID];
			if(cur.state=="open"){
				cells["cell_" + currentCellID].state = "close";
				currentCellID = cur.parent;
			}else{
				Err.errlog(line, character);
			}
		}
		Scope.goToPrevScope();
		state = "main";
	}

	function getIn(){
		var newCell = {
			name : "",
			id : cCount,
			cid : "cell_" + cCount,
			state : "open",
			includes : [],
			value : "",
			type : "v", //for variable
			dataType : "undefined",
			scope : Scope.getCurrentScope("l_id"), //scope level id
			parent : currentCellID,
			process : function(x){
				return x;
			}
		}


		if(currentCellID!=='global'){
			cells["cell_" + currentCellID].includes.push("cell_" + newCell.id);	
		}
		
		cells[newCell.cid] = newCell;
		currentCellID = newCell.id;
		
		Scope.goToNextScope();		

		//console.log("currentCellID = " + currentCellID);  
		cCount++;
	}

	function process_main(c){
		switch(c){
			case " " : 
				//console.log("Встретил пробел, пропускаю");
			break;
			case "(" :
				getIn();
			break;
			case ")" :
				getOut();
			break;
			case "$":
				if(currentCellID=="global"){
					Err.errlog(line,character);
					throw("Name definition on global namespace");
				}else{
					if(cells["cell_" + currentCellID].name.length){
						Err.errlog(line,character);
						throw("Unexpected symbol $");
					}else{
						state = "-n";		
					}					
				}				
			break;
			default:
				//если не из управляющей конструкции
				if("0123456798".indexOf(c)!==-1){
					state = '-v-n';
					cells["cell_"+currentCellID].value += c;
					cells["cell_"+currentCellID].dataType = "number";
					cells["cell_"+currentCellID].type = "v";
				}else{

				}
			break;
		}
	}

	function process_value_number(c){
		var dt = cells["cell_"+currentCellID].dataType;

		if("0123456789".indexOf(c)!==-1){
			if(stack.vx.possibly_in_double){
				cells["cell_"+currentCellID].dataType = "double";
			}else{
				cells["cell_"+currentCellID].dataType = "int";
			}
			cells["cell_"+currentCellID].value += c;
		}else
		if(c=="."){
			if(stack.vx.possibly_in_double){
				Err.errlog(line,character);
				throw("Unexpected symbol '.' at value");
			}else{
				cells["cell_"+currentCellID].value += c;
				stack.vx.possibly_in_double = true;
			}
		}else
		if(c==" "){
			if(dt=="double"){
				cells["cell_"+currentCellID].value = parseFloat(cells["cell_"+currentCellID].value);	
			}else{
				cells["cell_"+currentCellID].value = parseInt(cells["cell_"+currentCellID].value);	
			}			
			state = "main";
		}else
		if(c==")"){
			if(dt=="double"){
				cells["cell_"+currentCellID].value = parseFloat(cells["cell_"+currentCellID].value);	
			}else{
				cells["cell_"+currentCellID].value = parseInt(cells["cell_"+currentCellID].value);	
			}			
			getOut();
		}else{

		}
	}

	function process_name(c) {
		var curName = cells["cell_" + currentCellID].name;
		if(c==")"){
			if(!curName.length){
				Err.errlog(line, character);
				throw("Не годиться");
			}else{
				getOut();
			}
		}else
		if(c=="("){
			if(!curName.length){
				Err.errlog(line, character);
				throw("Не годиться");
			}else{
				state="main";
				getIn();
			}
		}else
		if(c==" "){
			if(!curName.length){
				Err.errlog(line, character);
				throw("Не годиться");
			}else{
				state = "main";
			}
		}else
		if(isApprovedSymbol(c, curName.length, "name")){
			cells["cell_" + currentCellID].name += c;
		}else{
			Err.errlog(line, character);	
			throw("Unexpected symbol at name:");
		}
	}

	function isApprovedSymbol(c, position, key){
		if(key=="name"){
			if(position>0){
				if("!@#$^&*(+=./?\\`'\"[]{}<>,~".indexOf(c)==-1){
					return true;
				}else{
					return false;
				}
			}else{
				if("0123456789!@#$^&*(+=-./?\\`'\"[]{}<>,~".indexOf(c)==-1){
					return true;
				}else{
					return false;
				}
			}
		}
	}


	//main loop
	for (var i = 0; i < s.length; i++) {
		var c = s[i];

		if(c=='\n'){
			line++;
			character=1;
		}

		switch(state){
			case "main":
				process_main(c);
			break;
			case "-n":
				process_name(c);
			break;
			case "-v-n":
				process_value_number(c);
			break;
		}

		character++;
	};

	return cells;
}

function Generator(){
	return {
		getNewTid : function(){
			return ( Math.random()*65536 >> 0 ) + "-" + ( Math.random()*65536 >> 0 ) + "-" + ( Math.random()*65536 >> 0 ) + "-" + ( Math.random()*65536 >> 0 );
		}
	}
}

function ScopeController(){
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

function ErrorController(){
	var _self = {};
	
	_self.errlog = function(l, c){
		console.error("Mismatch at line: " + l + " char: " + c);
	}
	
	_self.endenv = function(msg){
		throw(msg);
	}

	return _self;
}