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
	
	describe('download feature ',function(){
		
		it('all stream',function(done){
			var bytes = 0;
			var hd = new HttpDownloader({ url: 'http://127.0.0.1:'+ this.supWebServer.port + '/download-all',
										  disableProxy : true });
			
			hd.on('data',function(data,resInfo){
				resInfo.dataSize.should.eql(10240);
				bytes = bytes + data.length;
			});
		
			hd.on('end',function(data,resInfo){
				bytes.should.eql(10240);
				resInfo.resSize.should.eql(10240);
				done();
			});
			
			hd.start();
		});
		
		it('cipher stream',function(done){
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
		
		it('using ptun',function(done){
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
		
		it("get resource size",function(done){
			var hd = new HttpDownloader({
				url: 'http://127.0.0.1:' + this.supWebServer.port + '/size',
				disableProxy : true
			});
			
			hd.resInfo(function(resInfo,error){
				resInfo.resSize.should.eql(10240);
				done();
			});
			
		});
		
		it('check resInfo enable',function(done){
			var hd = new HttpDownloader({ url: 'http://127.0.0.1:' + this.supWebServer.port + '/check-size',
				  disableProxy : true }),
				cont = 0,
				self = this;
			
			hd.on('data',function(data,resInfo){
				cont++;
				if ( cont == 2 ){
					resInfo.should.eql({ url: 'http://127.0.0.1:' + self.supWebServer.port + '/check-size',
						  resSize: 3000,
						  dataSize: 1000,
						  chunkInfo: null });
				}
			});
			
			hd.on('end',function(data,resInfo){
				done();
			});
			
			hd.start();
		});
		
		it('check resInfo disable',function(done){
			var hd = new HttpDownloader({ url: 'http://127.0.0.1:' + this.supWebServer.port + '/check-size',
				  disableProxy : true, disableResInfo: true }),
				cont = 0,
				self = this;

			hd.on('data',function(data,resInfo){
				cont++;
				if ( cont == 2 ){
					resInfo.should.eql({ url: null,
						  resSize: null,
						  dataSize: 1000,
						  chunkInfo: null });
				}
			});
			
			hd.on('end',function(data,resInfo){
				resInfo.should.eql({ url: 'http://127.0.0.1:' + self.supWebServer.port + '/check-size',
					  resSize: 3000,
					  dataSize: null,
					  chunkInfo: null });
				done();
			});
			
			hd.start();
		});
		
		it('failed download',function(done){
			
			var hd = new HttpDownloader({ url: 'http://127.0.0.1:' + this.supWebServer.port + '/error',
				  disableProxy : true, disableResInfo: true });

			hd.on('error',function(error,response){
				response.statusCode.should.eql(500);
				done();
			});
			
			hd.start();
		});
		
		it('error request',function(done){
			
			var hd = new HttpDownloader({ url: 'fake_protocol://127.0.0.1:' + this.supWebServer.port + '/error',
				  disableProxy : true, disableResInfo: true });

			hd.on('error',function(error,response){
				error.message.should.eql('Invalid protocol: null');
				done();
			});
			
			hd.start();
		});
		
	});
});