var IE = document.all;

/* centrar el elemento verticalmente en la pantalla */
function center_horizontal(element) {
  var width  = element.offsetWidth;
  var screen_width  = IE ? screen.width : window.innerWidth;
  var x = (screen_width-width)/2;

  element.style.left = x+'px';
}

/* centrar el elemento horizontalmente en la pantalla */
function center_vertical(element) {
  var height = element.offsetHeight;
  var screen_height = IE ? screen.height : window.innerHeight;
  var y = (screen_height-height)/2;

  if (IE) y -= 100;

  element.style.top = y+'px';
}

/* centrar el elemento en la pantalla */
function center(element) {
  center_vertical(element);
  center_horizontal(element);
}

/* centrar el elemento considerando el desplazamiento */
function center_dialog(element) {
  center(element);

  var vertical_scroll = 0;

  if (window.pageYOffset)
    vertical_scroll = window.pageYOffset;
  else if (document.documentElement)
    vertical_scroll = document.documentElement.scrollTop;
  else if (document.body)
    vertical_scroll = document.body.scrollTop;

  element.style.top = parseInt(element.style.top)+vertical_scroll+'px';
}

// This code is in the public domain. Feel free to link back to http://jan.moesen.nu/
function sprintf() {
  if (!arguments || arguments.length < 1 || !RegExp) return;
  var str = arguments[0];
  var re = /([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X)(.*)/;
  var a = b = [], numSubstitutions = 0, numMatches = 0;
  while (a = re.exec(str)) {
    var leftpart = a[1], pPad = a[2], pJustify = a[3], pMinLength = a[4];
    var pPrecision = a[5], pType = a[6], rightPart = a[7];
    
    numMatches++;
    if (pType == '%') subst = '%';
    else {
      numSubstitutions++;
      if (numSubstitutions >= arguments.length) alert('Faltan argumentos para completar la cadena.\n');
      var param = arguments[numSubstitutions];
      var pad = '';
             if (pPad && pPad.substr(0,1) == "'") pad = leftpart.substr(1,1);
        else if (pPad) pad = pPad;
      var justifyRight = true;
             if (pJustify && pJustify === "-") justifyRight = false;
      var minLength = -1;
             if (pMinLength) minLength = parseInt(pMinLength);
      var precision = -1;
             if (pPrecision && pType == 'f') precision = parseInt(pPrecision.substring(1));
      var subst = param;
             if (pType == 'b') subst = parseInt(param).toString(2);
        //else if (pType == 'c') subst = String.fromCharCode(parseInt(param));
        else if (pType == 'c') subst = param; /* todo ::: terminar de corregir */
        else if (pType == 'd') { /* modificada para que no descarte los ceros adelante: %03d */
          subst = parseInt(param) ? parseInt(param) : 0;
          if (pPad) { /* number.ToString().PadLeft(pPad, '0') */
            var fill = pMinLength-subst.toString().length;
            for (var i = 0; i < fill; i++) subst = '0'+subst;
          }
        }
        else if (pType == 'u') subst = Math.abs(param);
        else if (pType == 'f') subst = (precision > -1) ? Math.round(parseFloat(param)*Math.pow(10,precision))/Math.pow(10,precision)
                                                        : parseFloat(param);
        else if (pType == 'o') subst = parseInt(param).toString(8);
        else if (pType == 's') subst = param;
        else if (pType == 'x') subst = ('' + parseInt(param).toString(16)).toLowerCase();
        else if (pType == 'X') subst = ('' + parseInt(param).toString(16)).toUpperCase();
    }
    str = leftpart + subst + rightPart;
  }
  return str;
}

/* conectar un callback al estilo gtk */
function connect(element, signal, callback) {
  if (document.attachEvent)
    element.attachEvent('on'+signal, callback);
  else if (document.addEventListener)
    element.addEventListener(signal, callback, false);
}

/* desconectar un callback */
function disconnect(element, signal, callback) {
  if (document.attachEvent)
    element.detachEvent('on'+signal, callback);
  else if (document.addEventListener)
    element.removeEventListener(signal, callback, false);
}

function get_prefix(component) {
  return '/'+component+'/';
}

/* por Peter-Paul Koch & Alex Tingle */
function findPosX(obj) {
  var curleft = 0;
  if (obj.offsetParent)
    while (1) {
      curleft += obj.offsetLeft;
      if(!obj.offsetParent)
        break;
      obj = obj.offsetParent;
    }
  else if (obj.x)
    curleft += obj.x;
  return curleft;
}
    
function findPosY(obj) {
  var curtop = 0;
  if (obj.offsetParent)
    while (1) {
      curtop += obj.offsetTop;
      if (!obj.offsetParent)
        break;
        obj = obj.offsetParent;
      }
  else if (obj.y)
    curtop += obj.y;
  return curtop;
}

/* por Bernard Marx */
function getElementsByAttribute (attribute, value, container) {
  container = container || document;
  var all = container.all || container.getElementsByTagName('*');
  var matches = new Array();
  for(var i = 0; i < all.length; i++)
    if(all[i].getAttribute(attribute) == value)
      matches[matches.length] = all[i];
  return matches;
} 

function getElementsByCondition (condition, container) {
  container = container || document;
  var all = container.all || container.getElementsByTagName('*');
  var matches = new Array();
  for(var i = 0; i < all.length; i++)
    if (condition(all[i], i))
      matches[matches.length] = all[i];
  return matches;
} 

/* una adaptación del código original de Shaun Inman */
/* lo que hace es cambiar la posición del 'input type file' para que
 * siga al ratón y asegurar que el evento click sobre el botón dispare
 * el evento click del 'input original' que no se ve porque es
 * transparente pero en realidad está constantemente encima del botón */
function stylize(element) {
  ie = 0;
  if (window.opera || (ie && ie < 5.5) || !document.getElementsByTagName)
    return; /* no support opacity */
  
  element.parentNode.file = element;
  element.parentNode.onmousemove = function(_event) {
    if (typeof _event == 'undefined')
      _event = window.event;

    if (typeof _event.pageY == 'undefined' &&
        typeof _event.clientX == 'number' &&
        document.documentElement)
    {
      _event.pageX = _event.clientX + document.documentElement.scrollLeft;
      _event.pageY = _event.clientY + document.documentElement.scrollTop;
    }
    
    var offset_x = offset_y = 0;
    var element = this;
    if (element.offsetParent) {
      offset_x = element.offsetLeft;
      offset_y = element.offsetTop;
      while (element = element.offsetParent) {
        offset_x += element.offsetLeft;
        offset_y += element.offsetTop;
      }
    }
    
    var x = _event.pageX - offset_x;
    var y = _event.pageY - offset_y;
    var width = this.file.offsetWidth;
    var height = this.file.offsetHeight;
    
    this.file.style.top = y-(height/2)+'px';
    this.file.style.left = x-(width-30)+'px';
  }
}

/* por Juan M. Mouriz */
function on_enter_key_press(last, e) {
  var keycode;

  if (window.event)
    keycode = window.event.keyCode;
  else if (e)
    keycode = e.which;
  else
    return true;
  
  if (keycode == 13) {
    last.form.submit();
    return false;
  } else
    return true;
}

/* por Mircho Mirev, adaptado */
function autocomplete(e) {
  e = e ? e : window.hEvent;

  if (e.keyCode == 16) return;

  var element = e.srcElement ? e.srcElement : e.originalTarget;
  var value = element.value.toLowerCase();

  if (e.keyCode == 8)
    value = value.substring (0, value.length - 1);

  if (value.length < 1) return;

  var datasource = element.getAttribute('autocomplete').toString();

  if (datasource.indexOf('array:') >= 0)
    var items = eval(datasource.substring(6));
  else if (datasource.indexOf( 'list:') >= 0)
    var items = datasource.substring(5).split('|');

  for (var i = 0; i < items.length; i++) {
    var current = items[i];

    if (current.toLowerCase().indexOf(value, 0) == 0 &&
        current.length > value.length) {

    	element.value = items[i];

    	if (element.createTextRange) {
          range = element.createTextRange();
          range.findText(items[i].substr(value.length));
          range.select();
    	} else
          element.setSelectionRange(value.length, current.length);

    	return;
    }
  }
}

/* obtener la extensión de un archivo */
function get_extension(file) {
  var file_parts = file.split('.');
  var extension = file_parts[file_parts.length-1];
  return extension.toLowerCase();
}
