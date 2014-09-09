var 	events = require("events"),
		util = require("util"),
		Chunker = require('./chunker'),
		HttpDownloader = require('./httpdownloader'),
		TaskExecutor = require('./taskexecutor');

var DownloadWarker = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
			 hd = null,
			 resSize = null,
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
		hd = null,
		chunker = null,
		taskExe = null,
		totByte = 0,
		workerMgr = null;

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
		var cn = chunker.cn();
		if( cn != chunker.chunks() ){
			var ck = chunker.next();
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
		totByte += chunk.data.length;
		self.emit('chunk',chunk);
		
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
	
	function setupDirectDownload(){
		var hd = new HttpDownloader(config);
		hd.on('data',function(data){
			totByte += data.length;
			self.emit('data',{cn: null, ck: null, data: data});
		});
		hd.on('end',function(data){self.emit('finish');});
		return hd;
	};
	
	function setupChunkDownload(resSize){
		var taskExe = new TaskExecutor(_taskSupplier(self),config.workers);
		taskExe.on('taskComplete',_onTaskComplete(self));
		taskExe.on('allTasksComplete',_onAllTaskComplete(self));
		return taskExe;
	};
	
	function init(){	
		if( config.chunkDisable ){
			resSize = null;
			workerMgr = setupDirectDownload();
		}
	};
	
	init();	
	
	this.start = function(){
		if ( !workerMgr ){
			var hd = new HttpDownloader(config);
			hd.size(function(resInfo,error){
				if(!error){
					if( resInfo.size ){
						chunker = new Chunker(resInfo.size,config.chunkSize);
						workerMgr = setupChunkDownload(resInfo.size)
						.start();
					}
					else {
						workerMgr = setupDirectDownload()
						.start();
					}
				}
			});
		}
		else {
			workerMgr.start();
		}
	};
	
	this.status = function(){
		return { resSize: config.resSize, totByte: totByte };
	};
};

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;