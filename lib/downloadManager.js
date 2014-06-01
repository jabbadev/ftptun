var 	events = require("events"),
			util = require("util");

var DownloadManager = function(config){
	events.EventEmitter.call(this);
	
	this.workers = [];
	this.config = config;
	
	this.init = function(){
		if( this.config.workers && this.config.size ){
			this.chunker = new Chunker( this.config.resSize, this.config.chunkSize )		
		}	
	};
	
	this.start = function(){
		
	};	
	
	this.init();	
	
}

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;