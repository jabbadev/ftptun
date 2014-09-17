
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
		size = null,
		stream = null;
		sizeSream = null,
		url = null;
	
	function onDataHandler(data){
		var dataB64,dataSize = 0;
		if ( config.ptun ) {
			dataB64 = decipher.update(data);
			data = new Buffer(dataB64,'base64');
		}
		dataSize = (data) && data.length;
		
		self.emit('data',data,{ dataSize: dataSize });
	};
	
	function onFinishHandler(){
		var data = null, dataSize = 0;
		if ( config.ptun ) {
			var dataB64 = decipher.final();
			data = new Buffer(dataB64,'base64');
		}
		dataSize = (data) && data.length || 0;
		
		self.emit('end',data,{url: url, size: size, dataSize: dataSize });
	};
	
	function init(){
		var chunkPrefix = "";
		
		size = ( config.size ) && config.size || null;
		
		stream = new PassThrough();
		stream.on('data',function(data){onDataHandler(data);});
		stream.on('end',function(){onFinishHandler();});
		
		reqOpt.url = URL.parse(config.url);
		if( typeof config.disableProxy !== "undefined" ){
			reqOpt.proxy = !config.disableProxy;
		}
		
		if ( config.ptun ) {
			decipher = crypto.createDecipher(config.ptun.algorithm,config.ptun.secretkey);
			chunkPrefix = "x-";
			
			ptunReqBody = reqOpt.url;
			
			reqOpt.method = 'POST';
			reqOpt.url = config.ptun.server;
			reqOpt.json = ptunReqBody;
		}

		if ( config.chunk ) {
			var range = chunkPrefix + "range"; cache = chunkPrefix + "cache-control";
			reqOpt.headers = {};
			reqOpt.headers[range] = "bytes=" + config.chunk.start + "-" + config.chunk.end;
			reqOpt.headers[cache] = "no-store";
		}
	};
	
	this.start = function(){
		request(reqOpt,function(error, response, body){
			if (!error && response.statusCode == 200) {
				url = response.request.uri.href;
				size = response.headers['content-length'];
			}
		}).pipe(stream);
	};
	
	function onResSize(callback,resInfo){
		size = resInfo.size;
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
				
				onResSize(callback,{
					url: response.request.uri.href,
					size: cl});
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
