var 	events = require("events"),
		util = require("util"),
		Chunker = require('./chunker'),
		HttpDownloader = require('./httpdownloader'),
		TaskExecutor = require('./taskexecutor');

var DownloadWarker = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
			 hd = null,
			 dataBuffer = new Buffer([]);	
	
	function onDataHandler(data){
		dataBuffer = Buffer.concat([dataBuffer,data]);
	};
	
	function onDownloadComlete(){
		self.emit('end',dataBuffer);
	};
	
	function init(){
		hd = new HttpDownloader(config);
		hd.on('data',onDataHandler);
		hd.on('end',onDownloadComlete);
	};
	
	this.start = function(){
		hd.start();
	};
	
	init();
};

util.inherits(DownloadWarker,events.EventEmitter);

var DownloadManager = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
		chunksReady = {},
		awaitedChunk = 0,
		hd = null;

	function getTask(cn,ck,self){
		return function(callback){
			config.chunk = { start: ck[0], end: ck[1] };
			var dw = new DownloadWarker(config);
			dw.on('end',function(data){
				callback({cn: cn, ck: ck, data: data},null);
			});
			dw.start();
		};
	};
	
	function taskSupplier(){
		var cn = this.chunker.cn();
		if( cn != this.chunker.chunks() ){
			var ck = this.chunker.next();
			return getTask(cn,ck,this);
		}
		
		return null;
	};
	
	function _taskSupplier(self){
		return function(){
			return taskSupplier.call(self);
		};
	};
	
	function onDownloadedChunk(chunk,error){
		var chkReady = true;
		chunksReady[chunk.cn] = chunk;
		
		while(chkReady){
			if(chunksReady[awaitedChunk]){
				self.emit('data',chunksReady[awaitedChunk]);
				delete chunksReady[awaitedChunk];
				awaitedChunk++;
			}
			else{ chkReady = false; }
		}
	};
	
	function _onTaskComplete(self){
		return function(success,error){
			onDownloadedChunk(success,error);
		};
	};
	
	function downloadedCompete(){
		self.emit('finish');
	};
	
	function _onAllTaskComplete(){
		return function(){
			downloadedCompete.call();
		};
	};
	
	this.start = function(){
		if( config.resSize ){
			this.taskExe.start();
		}
		else {
			hd.start();
		}
	};
	
	this.init = function(){
		if( config.resSize ){
			this.chunker = new Chunker(config.resSize,config.chunkSize);
			this.taskExe = new TaskExecutor(_taskSupplier(this),config.workers);
			this.taskExe.on('taskComplete',_onTaskComplete(this));
			this.taskExe.on('allTasksComplete',_onAllTaskComplete(this));
		}
		else {
			hd = new HttpDownloader(config);
			hd.on('data',function(data){self.emit('data',{cn: null, ck: null, data: data});});
			hd.on('end',function(data){self.emit('finish');});
		}
	};
	
	this.init();	
	
};

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;