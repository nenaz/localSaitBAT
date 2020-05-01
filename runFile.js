var execFile = require('child_process').execFile;

// execFile('C:\KMPlayer\KMPlayer.exe');
var fun =function(){
  console.log("fun() start");
  execFile('start.bat', function(err, data) {  
       console.log(err)
       console.log(data.toString());                       
   });  
}
fun();