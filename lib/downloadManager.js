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
	
	function onDataHandler(data,resInfo){
		dataBuffer = Buffer.concat([dataBuffer,data]);
		self.emit('data',resInfo);
	};
	
	function onDownloadComlete(data,resInfo){
		if(data) {
			dataBuffer = Buffer.concat([dataBuffer,data]);
		}
		
		self.emit('end',dataBuffer,resInfo);
	};
	
	function onErrorHandler(error,response,resInfo){
		self.emit('error',error,response,resInfo);
	};
	
	function init(){
		hd = new HttpDownloader(config);
		hd.on('data',onDataHandler);
		hd.on('end',onDownloadComlete);
		hd.on('error',onErrorHandler);
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
		chunker = null,
		totByte = 0,
		workerMgr = null;

	function getTask(cn,ck,self){
		return function(callback){
			config.chunk = { start: ck[0], end: ck[1] };
			var dw = new DownloadWarker(config);
			
			dw.on('data',function(resInfo){
				totByte += resInfo.dataSize;
				resInfo.downloadedByte = totByte;
				self.emit('checkDownload',resInfo);
			});
			
			dw.on('end',function(data,resInfo){
				resInfo.chunkInfo.cn = cn;
				if ( data ){
					totByte += resInfo.dataSize;
					resInfo.downloadedByte = totByte;
				}
				self.emit('checkDownload',resInfo);
				callback({ data: data, resInfo: resInfo },null);
			});
			
			dw.on('error',function(error,response,resInfo){
				callback(null,{ error: error, response: response, resInfo: resInfo });
			});
			
			dw.start();
		};
	};
	
	function taskSupplier(){
		var cn = chunker.cn();
		if( cn != chunker.chunks() ){
			var ck = chunker.next();
			return getTask(cn,ck,self);
		}
		
		return null;
	};
	
	function _taskSupplier(){
		return function(){
			return taskSupplier();
		};
	};
	
	function onDownloadedChunk(chunk,error){
		if ( error ){
			self.emit('error',error.error,error.response,error.resInfo);
			return;
		}
		
		var chkReady = true;
		chunksReady[chunk.resInfo.chunkInfo.cn] = chunk;
		//totByte += chunk.data.length;
		self.emit('chunk',chunk.data,chunk.resInfo);
		
		while(chkReady){
			if(chunksReady[awaitedChunk]){
				self.emit('data',chunksReady[awaitedChunk].data,chunksReady[awaitedChunk].resInfo);
				delete chunksReady[awaitedChunk];
				awaitedChunk++;
			}
			else{ chkReady = false; }
		}
	};
	
	function _onTaskComplete(self){
		return function(chunk,error){
			onDownloadedChunk(chunk,error);
		};
	};
	
	function downloadedCompete(){
		self.emit('finish',null,{});
	};
	
	function _onAllTaskComplete(){
		return function(){
			downloadedCompete();
		};
	}; 
	
	function setupDirectDownload(){
		var hd = new HttpDownloader(config);
		hd.on('data',function(data,resInfo){
			totByte += data.length;
			resInfo.downloadedByte = totByte;
			self.emit('data',data,resInfo);
			self.emit('checkDownload',resInfo);
		});
		
		hd.on('end',function(data,resInfo){
			if( data ){
				totByte += data.length;
			}
			resInfo.downloadedByte = totByte;
			self.emit('checkDownload',resInfo);
			self.emit('finish',data,resInfo);
		});
		
		hd.on('error',function(error,response,resInfo){
			self.emit('error',error,response,resInfo);
		});
		
		return hd;
	};
	
	function setupChunkDownload(resSize){
		var taskExe = new TaskExecutor(_taskSupplier(),config.workers);
		taskExe.on('taskComplete',_onTaskComplete());
		taskExe.on('allTasksComplete',_onAllTaskComplete());
		return taskExe;
	};
	
	function init(){
		if( config.disableChunk ){
			resSize = null;
			workerMgr = setupDirectDownload();
		}
	};
	
	init();	
	
	this.start = function(){
		if ( !workerMgr ){
			var hd = new HttpDownloader(config);
			hd.resInfo(function(resInfo,error){
				if(!error){
					if( isNaN(Number(resInfo.resSize)) || resInfo.resSize == null ){
						workerMgr = setupDirectDownload()
						.start();
					}
					else {
						chunker = new Chunker(resInfo.resSize,config.chunkSize);
						workerMgr = setupChunkDownload(resInfo.resSize)
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