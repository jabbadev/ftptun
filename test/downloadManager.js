
var should = require('should'),
	DownloadManager = require('../lib/downloadManager.js'),
	support = require('../support/webserver'),
	fs = require('fs'),
	http = require('http'),
	URL = require('url'),
	crypto = require('crypto');

describe('DownloadManager',function(){
	
	before(function(done){
		var self = this;
		support.createServer(
				'test/dm-resweb.txt',
				function(server){
					self.supWebServer = server;
					done();
				}
		);
	});
	
	after(function(){
		this.supWebServer.close();
	});
	
	describe('#DownloadManager test',function(){
		it('test download manager',function(done){
			
			var dm = new DownloadManager({
					workers: 3,
					chunkSize: 1024,
					resSize: 10240,
					reqOpt: URL.parse('http://127.0.0.1:' + this.supWebServer.port + '/chunk') 
			});
			
			/*
			dm.on('data',function(data){
				console.log(data.toString());	
			});
			
			dm.on('finish',function(){
				console.log(end);
			});*/
			
			dm.start();
			
		});
	});

});