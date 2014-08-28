var 	events = require("events"),
		util = require("util"),
		Chunker = require('./chunker'),
		HttpDownloader = require('./httpdownloader'),
		TaskExecutor = require('./taskexecutor');


var DownloadManager = function(config){
	events.EventEmitter.call(this);
	
	this.config = config;
	console.log(this.config.workers);
	this.init = function(){
		this.chunker = new Chunker(this.config.resSize,this.config.chunkSize);
		this.taskExe = new TaskExecutor(this.taskSupplier(),this.config.workers);		
	};
	
	this.taskSupplier = function(){
		var self = this;	
		return function(){
			self._taskSupplier();
		}
	};
	
	this._taskSupplier = function(){
		var self = this;
		console.log(this.chunker.cn(),this.chunker.chunks());
		if( this.chunker.cn() != this.chunker.chunks() ){
			var ck = this.chunker.next();
			
			return function(callback){ 
				console.log('download chunk: ',ck);
				callback(ck,null);
			};
		}
		
		return null;
	};
	
	this.start = function(){
		this.taskExe.start();
	};
	
	this.init();	
	
};

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;