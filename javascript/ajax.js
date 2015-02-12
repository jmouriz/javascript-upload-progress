var request = null;

/* hacer la consulta ajax y conectar el callback */
function ajax_query(url, query, callback, method) {
  if (request) {
    request.open(method, url, true); /* true: asíncrono */
    request.onreadystatechange = function() { if (request.readyState == 4) callback(); };
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.send(query);
  } else { /* pass */ }
  /* alert("Su navegador no soporta Ajax"); */ /* recuperar */

  return false;
}

/* consutlar por POST */
function do_ajax_query_post(url, query, callback) {
  return ajax_query(url, query, callback, 'post');
}

/* consutlar por GET */
function do_ajax_query_get(url, query, callback) {
  return ajax_query(url+'?'+query, null, callback, 'get');
}

/* método más utilizado */
function do_ajax_query(url, query, callback) {
  return do_ajax_query_post(url, query, callback);
}

/* crear el objeto para hacer consultas ajax */
function init_ajax() {
  if (window.XMLHttpRequest)
    request = new XMLHttpRequest();
  else if (window.ActiveXObject)
    try {
      request = new ActiveXObject("MSXML2.XMLHTTP");
    } catch (error) {
      try {
        request = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (error) { /* pass */ }
    }
}

connect(window, 'load', init_ajax);
