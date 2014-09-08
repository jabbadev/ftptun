var should = require('should'),
	support = require('../support/webserver'),
	HttpDownloader = require('../lib/httpdownloader'),
	fs = require('fs'),
	http = require('http'),
	crypto = require('crypto');
	
describe('HttpDownloader',function(){
	
	before(function(done){
		var cipher = crypto.createCipher('aes-256-cbc',"secret1234"),
			self = this;
		
		support.createServer(
				'test/hd-resweb.txt',
				function(server){
					self.supWebServer = server;
					done();
				}
		);
	});
	
	after(function(){
		this.supWebServer.close();
	});
	
	describe('#start()',function(){
		it('start http docwnload',function(done){
			var bytes = 0;
			var hd = new HttpDownloader({ url: 'http://127.0.0.1:'+ this.supWebServer.port + '/',
										  disableProxy : true });
			
			hd.on('data',function(data){
				bytes = bytes + data.length;
			});
		
			hd.on('end',function(data,resInfo){
				bytes.should.eql(10240);
				resInfo.size.should.eql(10240);
				done();
			});
			
			hd.start();
		});
		
		describe('#cipher download',function(){
			it('cipher download',function(done){
				var secMsg = "";
				var hd = new HttpDownloader({ url: 'http://127.0.0.1:' + this.supWebServer.port + '/cipher',
										  disableProxy : true,
										  ptun: { "server": "http://127.0.0.1:" + this.supWebServer.port + "/cipher", secretkey: "secret1234","algorithm": "aes-256-cbc" }});
			
				hd.on('data',function(data){
					secMsg = secMsg + data.toString();
				});
		
				hd.on('end',function(data,resInfo){
					if(data != null){
						secMsg = secMsg + data.toString();
					}
					secMsg.should.eql("This is a secret message");
					done();
				});
			
				hd.start();
			});
		});
		
		describe('#chunk download',function(){
			it('chunk download',function(done){
				var secMsg = "";
				var hd = new HttpDownloader({ url: 'http://127.0.0.1:' + this.supWebServer.port + '/chunk',
											  disableProxy : true,
										      chunk: { start: 1024, end: 2047 } });
	
				hd.on('data',function(data){
					secMsg = secMsg + data.toString();
				});
		
				hd.on('end',function(data,resInfo){
					if(data != null){
						secMsg = secMsg + data.toString();
					}
					secMsg.should.eql(new Array(1024).join('b')+'b');
					done();
				});
			
				hd.start();
				
			});
		});
		
		describe('#ptun download',function(){
			it('download using ptun',function(done){
				var secMsg = "";
				var hd = new HttpDownloader({ url: 'http://127.0.0.1:' + this.supWebServer.port + '/ptun_cipher',
					  						  disableProxy : true,
										      ptun: { "server": "http://127.0.0.1:" + this.supWebServer.port + "/ptun", secretkey: "secret1234","algorithm": "aes-256-cbc" } });
	
				hd.on('data',function(data){
					secMsg = secMsg + data.toString();
				});
		
				hd.on('end',function(data,resInfo){
					if(data != null){
						secMsg = secMsg + data.toString();
					}
					secMsg.should.eql("ptun download");
					done();
				});
			
				hd.start();
				
			});
		});
		
		describe('get resource size',function(done){
			it("get resource size",function(done){
				var hd = new HttpDownloader({
					url: 'http://127.0.0.1:' + this.supWebServer.port + '/size',
					disableProxy : true
				});
				
				hd.size(function(resInfo,error){
					resInfo.size.should.eql(10240);
					done();
				});
				
			});
		});
		
	});
});