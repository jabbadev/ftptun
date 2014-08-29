var 	events = require("events"),
		util = require("util"),
		Chunker = require('./chunker'),
		HttpDownloader = require('./httpdownloader'),
		TaskExecutor = require('./taskexecutor');

var DownloadWarker = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	var self = this;
	
	function init(){
		self.worker = new HttpDownloader(self.config);
	};
	
	this.start = function(){
		self.worker.start();
	};
	
	init();
};

util.inherits(DownloadWarker,events.EventEmitter);

var DownloadManager = function(config){
	events.EventEmitter.call(this);
	this.config = config;

	function getTask(ck,self){
		return function(callback){
			var dwConf = self.config;
			dwConf.chunk = { start: ck[0], end: ck[1] };
			var dw = new DownloadWarker(dwConf);
			dw.on('data',function(data){console.log('data: ',data);});
			dw.on('end',function(data){callback('download complete');});
			dw.start();
			//callback(ck,null);
		};
	};
	
	function taskSupplier(){
		if( this.chunker.cn() != this.chunker.chunks() ){
			var ck = this.chunker.next();
			return getTask(ck,this);
		}
		
		return null;
	};
	
	function _taskSupplier(self){
		return function(){
			return taskSupplier.call(self);
		};
	};
	
	function onDownloadedChunk(success,error){
		console.log('task complete: ',success,error);
	};
	
	function _onTaskComplete(self){
		return function(success,error){
			onDownloadedChunk(success,error);
		};
	};
	
	function downloadedCompete(){
		console.log('download completato ');
	};
	
	function _onAllTaskComplete(){
		return function(){
			downloadedCompete.call();
		};
	};
	
	this.start = function(){
		this.taskExe.start();
	};
	
	this.init = function(){
		this.chunker = new Chunker(this.config.resSize,this.config.chunkSize);
		this.taskExe = new TaskExecutor(_taskSupplier(this),this.config.workers);
		this.taskExe.on('taskComplete',_onTaskComplete(this));
		this.taskExe.on('allTasksComplete',_onAllTaskComplete(this));
	};
	
	this.init();	
	
};

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;