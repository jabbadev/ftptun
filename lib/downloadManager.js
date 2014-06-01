var 	events = require("events"),
			util = require("util"),
			Chunker = require('./chunker');

var DownloadManager = function(config){
	events.EventEmitter.call(this);
	
	this.workers = [];
	this.config = config;
	
	this.init = function(){
		console.log(this.config);
		if( this.config.workers && this.config.resSize ){
			this.chunker = new Chunker( this.config.resSize, this.config.chunkSize );
			
			for(var i=0; i < this.config.workers; i++ ){
				try {
					this.chunker.next();
					this.workers.push({
						hd: "",
						out: new Buffer();
					});
				}	
				catch(e){
					console.log(util.inspect(e));
					if(e.message == "No more chunks"){
						last;					
					}
				}
			}		
		}	
	};
	
	this.start = function(){
		
	};	
	
	this.init();	
	
}

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;