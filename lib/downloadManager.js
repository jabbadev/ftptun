var 	events = require("events"),
			util = require("util"),
			Chunker = require('./chunker'),
			HttpDownloader = require('./httpdownloader');

var DownloadWorker = function(config){
	events.EventEmitter.call(this);
	this.config = config;
	this.out = new Buffer();
	
	this.init = function(){
		
		console.log(this.config);
		this.hd = new HttpDownloader(this.config);
		this.hd.on('data',this.dataHandler);
		this.hd.on('end',this.endHandler);
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

					console.log('attach worker ',chunk);
					var dw = new DownloadWorker({
						reqOpt: this.config.recOpt,
						chunk: { start: chunk[0], end: chunk[1]},
						ptun: this.config.ptun					
					});
					
					console.log('dw ',dw);
							
					this.workers.push(dw);
					
				}	
				catch(e){
					console.log(e);
					if(e.message == "No more chunks"){
						break;					
					}
				}
			}	
			console.log('workers ',this.workers);	
		}	
	};
	
	this.start = function(){
		console.info('start worker');
		for(var dw in this.workers){
			console.log(dw);
			dw.start();
		}
	}
	
	this.init();	
	
}

util.inherits(DownloadManager,events.EventEmitter);

module.exports = DownloadManager;