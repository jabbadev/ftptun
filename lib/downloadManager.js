var 	events = require("events"),
		util = require("util"),
		Chunker = require('./chunker'),
		HttpDownloader = require('./httpdownloader'),
		TaskExecutor = require('./taskexecutor');

var DownloadWarker = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	var self = this,
			 hw,
			 dataBuffer = new Buffer([]);	
	
	function onDataHandler(data){
		dataBuffer = Buffer.concat([dataBuffer,data]);
	};
	
	function onDownloadComlete(){
		self.emit('end',dataBuffer);
	};
	
	function init(){
		hd = new HttpDownloader(self.config);
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
	this.config = config;

	function getTask(cn,ck,self){
		return function(callback){
			var dwConf = self.config;
			dwConf.chunk = { start: ck[0], end: ck[1] };
			var dw = new DownloadWarker(dwConf);
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
		console.log('task complete: ',chunk.data.toString(),error);
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