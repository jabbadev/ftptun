
var Chunker = function(size,cs){
	this.size = size;
	this.cs = cs;
	this.index = 0;
	this.acn = 0;
	
	this.next = function(){
		var chunk;
		if ( this.index < this.size ) {
			chunk = [ this.index, this.index + this.cs - 1 ];
			if ( this.index + this.cs - 1 > this.size ) {
				chunk = [ this.index, this.size ];
			}
			this.index = this.index + this.cs;
			this.acn++;
		}
		else {
			throw new Error("No more chunks");
		}
		return chunk;
	};
	
	this.cn = function(){
		return this.acn;
	};
	
	this.chunks = function() {
		if( this.size % this.cs ){
			return Math.floor(this.size/this.cs) + 1;
		}
		return this.size/this.cs;
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