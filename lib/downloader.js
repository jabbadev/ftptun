
var URL = require('url'),
    HttpDownloader = require('./httpdownloader'), 
	   http = require('http');

var Downloader = function( conf, url ) {
	this.conf = conf;
	this.resURL = url;
	this.reqURL = URL.parse(url);
	this.reqOpt = this.reqURL;
	
	this.setUpRequest = function() {
		this.reqOpt.headers = {};
		if ( this.conf['user-agent'] ) {
			this.reqOpt.headers['User-Agent'] = this.conf['user-agent'];
		}
		if ( this.conf['proxy'] ) {
			this.reqOpt.host = this.conf.proxy.host;
			this.reqOpt.port = this.conf.proxy.port;
			this.reqOpt.hostname = this.conf.proxy.host;
			this.reqOpt.path = this.resURL;
			this.reqOpt.headers.Host = this.reqURL.hostname;
			this.reqOpt.method = "GET";
			
			if ( this.conf.proxy['proxy-auth'] == "Basic" ){
				this.reqOpt.headers['Proxy-Authorization'] = 
					this.conf.proxy['proxy-auth'] + " " + 
					new Buffer(this.conf.proxy['proxy-user']+ ":" + this.conf.proxy['proxy-passwd']).toString('base64');
			}
		}
	}
	
	this.getWebResSize = function(onResSize,onResMoved){
		var req, $this = this;
		this.reqOpt.method = 'HEAD';
		req = http.request(this.reqOpt,function(res){
			if ( res.statusCode == 301 ) {
				console.log(res.headers);
				onResMoved.call($this,res.headers.location);
			}
			else {
				onResSize.call($this,res.headers['content-length']);
			}
		});
		req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});
		req.end();
	}
	
	this.startDownload = function(resSize){
		this.resSize = resSize;
		
		console.log('reqOpt: ',this.reqOpt);
		this.reqOpt.method = 'GET';
		var hd = new HttpDownloader({ reqOpt: this.reqOpt });
	
		var secMsg = "";
		hd.on('data',function(data){
			secMsg = secMsg + data.toString();
		});

		hd.on('end',function(data){
			if(data != null){
				secMsg = secMsg + data.toString();
			}
			console.log(data);
		});
	
		hd.start();
		
		console.log('RES SIZE %i',this.resSize);
	}
	
	this.onResMoved = function(newURL){
		this.resURL = newURL;
		this.reqURL = URL.parse(newURL);
		this.reqOpt = this.reqURL;
		this.setUpRequest();
		this.getWebResSize(this.startDownload,this.onResMoved);
	}
	
	this.setUpRequest();
	this.getWebResSize(this.startDownload,this.onResMoved);
};

module.exports = Downloader;