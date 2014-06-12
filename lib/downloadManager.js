var 	events = require("events"),
			util = require("util"),
			Chunker = require('./chunker'),
			HttpDownloader = require('./httpdownloader');

var DownloadWorker = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	this.out = null;
	
	this.init = function(){
		var $this = this;
		this.name = "DownloadWorker[" + this.config.chunk.start + "," + this.config.chunk.end + "]";
		console.log(this.name);
		this.hd = new HttpDownloader(this.config);
		this.hd.on('data',function(data){$this.dataHandler.call($this,data)});
		this.hd.on('end',function(){$this.endHandler.call($this)});
	};
	
	this.dataHandler = function(data){
		console.log('data: ',data);
	};
	
	this.endHandler = function(data){
		console.log('finish ', this.name );
	};
	
	this.start = function(){
		this.hd.start();
	};
	
	this.init();
}

util.inherits(DownloadWorker,events.EventEmitter);

var DownloadManager = function(config){
	events.EventEmitter.call(this);
	
	this.workers = [];
	this.config = config;
	
	this.init = function(){
		
		if( this.config.workers && this.config.resSize ){
			this.chunker = new Chunker( this.config.resSize, this.config.chunkSize );
			
			for(var i=0; i < this.config.workers; i++ ){
				
				try {
					var chunk = this.chunker.next();
					var dw = new DownloadWorker({
						reqOpt: this.config.reqOpt,
						chunk: { start: chunk[0], end: chunk[1]},
						ptun: this.config.ptun
					});
							
					this.workers.push(dw);
				}	
				catch(e){
					if(e.message == "No more chunks"){
						break;					
					}
					else {
						throw e
					}
				}
			}	
		}	
	};
	
	this.start = function(){
		console.info('start workers');
		for(var i=0; i < this.workers.length ; i++){
			this.workers[i].start();
		}
	}
	
	this.init();	
	
}

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;