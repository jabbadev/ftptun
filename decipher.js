
var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes192',"secret1234")
	fs = require('fs'),
	outStream = fs.createWriteStream('output'),
	msg = [];

process.stdin.setEncoding('ascii');
process.stdin.on('readable', function(chunk) {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    msg.push(deipher.update(chunk,'hex','binary'));
  }
});

process.stdin.on('end', function() {
  msg.push(deipher.final('binary'));
  fs.appendFile('output',msg.join());
});
