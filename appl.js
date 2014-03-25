
var http = require('http'),
    crypto = require('crypto');
	
http.createServer(function (req,clientRes) {

  var postBody = "",
      cipher = crypto.createCipher('aes192',"secret1234");
  
  clientRes.writeHead(200,{'Content-Type': 'text/plain'});
  
  req.setEncoding('utf8');
  req.on('data',function(data){
  	postBody = postBody + data;
  });
  req.on('end',function(){
     var reqOptions = JSON.parse(postBody);
     
	 http.get("http://itam.hbl.local",function(res){
		console.log("Got response: " + res.statusCode);
		
		res.setEncoding('utf8');
		res.on('data',function(chunk) {
			clientRes.write(cipher.update(chunk,'binary','hex'));
		});
		res.on('end',function(){
			clientRes.write(cipher.final('hex'));
			clientRes.end();
		});
	 });
     
  });
  
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');
