var 	events = require("events"),
		util = require("util"),
		Chunker = require('./chunker'),
		HttpDownloader = require('./httpdownloader'),
		TaskExecutor = require('./taskexecutor');


var DownloadManager = function(config){
	events.EventEmitter.call(this);
	
	this.workers = [];
	this.config = config;
	
	this.init = function(){
		this.chunker = new Chunker(this.config.resSize,this.config.chunkSize);
		this.taskExe = new TaskExecutor(this.taskSupplier,this.config.workers);		
	};
	
	this.taskSupplier = function(){
		if( this.chunker.cn() != this.chunker.chunks() ){
			return function(callback){
				
			};
		}
	};
	
	this.start = function(){
	};
	
	this.init();	
	
};

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;