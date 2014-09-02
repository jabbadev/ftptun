
var Chunker = function(size,cs){
	//this.size = size;
	//this.cs = cs;
	index = 0;
	acn = 0;
	
	this.next = function(){
		var chunk;
		if ( index < size ) {
			chunk = [ index, index + cs - 1 ];
			if ( index + cs - 1 > size ) {
				chunk = [ index, size ];
			}
			index = index + cs;
			acn++;
		}
		else {
			throw new Error("No more chunks");
		}
		return chunk;
	};
	
	this.cn = function(){
		return acn;
	};
	
	this.chunks = function() {
		if( size % cs ){
			return Math.floor(size/cs) + 1;
		}
		return size/cs;
	};
	
	this.forEach = function(callBack){
		var chunks = this.chunks();
		while(chunks){
			callBack(this.next());
			chunks--;
		}
	};
}

module.exports = Chunker;