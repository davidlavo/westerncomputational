// Create a scoping variable
if (typeof(ChromeSamples) == 'undefined') {
	var ChromeSamples = {};
}

ChromeSamples.loggingOn = true;

ChromeSamples.log = function() {
  if (ChromeSamples.loggingOn) {
    var line = Array.prototype.slice.call(arguments).map(function(argument) {
        return typeof argument === 'string' ? argument : JSON.stringify(argument);
    }).join(' ');

    document.querySelector('#log').textContent += line + '\n';
  }
}

ChromeSamples.clearLog = function() {
  document.querySelector('#log').textContent = '';
}

ChromeSamples.setStatus = function(status) {
  document.querySelector('#status').textContent = status;
}

ChromeSamples.setContent = function(newContent) {
  var content = document.querySelector('#content');
  while(content.hasChildNodes()) {
    content.removeChild(content.lastChild);
  }
  content.appendChild(newContent);
}
