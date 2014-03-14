exports.controller = {
	isApprovedSymbol: function(c, position, key){
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
}