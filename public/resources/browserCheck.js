//check that the user is using Chrome and if not throw an error message
  var isChrome = !!window.chrome; //&& !!window.chrome.webstore; //I removed this later part as it was failing in Chrome desktop

  if (isChrome == true) {
    // alert('Your browser is supported. Enjoy!');
  } else if (navigator.userAgent.indexOf("Firefox") > -1) {
  	// alert('Your browser is supported. Enjoy!');
  } else {
    window.location.href = '/unsupportedbrowser';
  };