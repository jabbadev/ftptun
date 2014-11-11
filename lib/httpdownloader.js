
var http = require('http'),
	events = require("events"),
	util = require("util"),
	URL = require('url'),
	crypto = require('crypto');
	request = require('request');
	PassThrough = require('stream').PassThrough;

var HttpDownloader = function(config){
	events.EventEmitter.call(this);
	
	var self = this,
		ptunReqBody = null,
		decipher = null,
		reqOpt = {},
		headReqOpt = null,
		stream = null;
		sizeSream = null,
		url = null,
		resSize = null,
		execResInfo = true;
	
	function onErrorHandler(error,response){
		self.emit('error',error,response,{ url: url, resSize: resSize, dataSize: null, chunkInfo: self.chunkInfo });
	};
		
	function onDataHandler(data){
		var dataB64,dataSize = null;
		if ( config.ptun ) {
			if ( config.ptun.secretkey && config.ptun.algorithm ){
				dataB64 = decipher.update(data);
				data = new Buffer(dataB64,'base64');
			}
		}
		dataSize = (data) && data.length ;
		
		self.emit('data',data,{ url: url, resSize: resSize, dataSize: dataSize, chunkInfo: self.chunkInfo });
	};
	
	function onFinishHandler(){
		var data = null, dataSize = null;
		if ( config.ptun ) {
			if ( config.ptun.secretkey && config.ptun.algorithm ){
				var dataB64 = decipher.final();
				data = new Buffer(dataB64,'base64');
			}
		}
		dataSize = (data) && data.length ;
		
		self.emit('end',data,{ url: url, resSize: resSize, dataSize: dataSize, chunkInfo: self.chunkInfo});
	};
	
	function init(){
		var chunkPrefix = "";
		
		execResInfo = !config.disableResInfo;
		
		stream = new PassThrough();
		stream.on('data',function(data){onDataHandler(data);});
		stream.on('end',function(){onFinishHandler();});
		
		reqOpt.url = URL.parse(config.url);
		if( typeof config.disableProxy !== "undefined" ){
			reqOpt.proxy = !config.disableProxy;
		}
		else {
			if ( config.proxy ){
				reqOpt.proxy = config.proxy;
			}
		}
		
		reqOpt.headers = {};
		if ( config.ptun ) {
			ptunReqBody = reqOpt.url;
			if ( config.ptun.secretkey && config.ptun.algorithm ){
				decipher = crypto.createDecipher(config.ptun.algorithm,config.ptun.secretkey);
				reqOpt.headers['x-encryption']="true";
			}
			chunkPrefix = "x-";
			
			//ptunReqBody = reqOpt.url;
			
			reqOpt.method = 'POST';
			reqOpt.url = config.ptun.server;
			reqOpt.json = ptunReqBody;
		}

		if ( config.chunk ) {
			var range = chunkPrefix + "range"; cache = chunkPrefix + "cache-control";
			//reqOpt.headers = {};
			reqOpt.headers[range] = "bytes=" + config.chunk.start + "-" + config.chunk.end;
			reqOpt.headers[cache] = "no-store";
		}
		
		self.chunkInfo = ( config.chunk ) && config.chunk || null;
	};
	
	function execRequest(resInfo){
		
		reqOpt.method = "GET";
		if ( config.ptun ) {
			reqOpt.method = "POST";
			delete reqOpt.json.method;
		}
		
		request(reqOpt,function(error, response, body){
				
			if (!error && response.statusCode == 200) {
				var cl = response.headers['content-length'],
					rcl = response.headers['resource-content-length'];
				url = response.request.uri.href;
				if(!config.chunk){
					if ( cl || rcl ){
						resSize = (!config.ptun) && cl || rcl;
						(isNaN(Number(resSize))) ? resSize = null : resSize = parseInt(resSize);
					}
				}
				else {
					if ( cl || rcl ){
						var resChunkSize = (!config.ptun) && cl || rcl;
						(isNaN(Number(resChunkSize))) ? self.chunkInfo.chunkSize = null : self.chunkInfo.chunkSize = parseInt(resChunkSize);
					}
				}
			} else {
				url = (!error) && response.request.uri.href|| config.url;
				onErrorHandler(error,response);
			}
		}).pipe(stream);
	}
	
	/* Public method */
	
	this.start = function(){
		if ( execResInfo ){
			this.resInfo(execRequest);
		}
		else {
			execRequest();
		}
	};
	
	function onResSize(callback,resInfo){
		resSize = resInfo.resSize;
		url = resInfo.url;
		callback(resInfo,null);
	};
	
	this.resInfo = function(callback){
		headReqOpt = reqOpt;
		headReqOpt.method = "HEAD";
		if ( config.ptun ) {
			headReqOpt.method = 'POST';
			headReqOpt.json.method = "HEAD";
		}
		
		request(headReqOpt,function(error,response){
			if (!error && response.statusCode == 200) {
				url = response.request.uri.href;
				var cl = response.headers['content-length'];
				if ( config.ptun ){
					cl = response.headers['resource-content-length'];
				}
				(isNaN(Number(cl))) ? cl = null : cl = parseInt(cl);
				
				onResSize(callback,{
					url: response.request.uri.href,
					resSize: cl});
			}
		});
	};
	
	this.url = function(){
		return url;
	};
	
	init();
};

util.inherits(HttpDownloader,events.EventEmitter);

module.exports = HttpDownloader;
