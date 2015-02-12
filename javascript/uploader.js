/* El mecanismo de subida de archivos consiste en subir el archivo (hacer el post) en un iframe oculto
 * y agregar un temporizador justo antes del envío (submit) para consultar el estado al módulo uploader
 * de apache cada una cantidad de segundos.
 */

/* La ventana de diálogo de progreso */
function ProgressDialog() {
  /*- PROPIEDADES PRIVADAS -*/
  var WIDTH = 220; /* el ancho de la barra */
  
  var id     = null;
  var timer  = null;
  /* otro temporizador no-anónimo que identifico para cancelar el fading por si el diálogo quiere
   * cerrarce antes que se haya terminado de abrir (cuando el archivo es muy chico) */
  var fading = null;
  var url    = '/uploader/progress';
  var query  = 'X-Progress-ID=';
  
  var opacity  = 0;

  var dialog   = null;
  var bar      = null;
  var percent  = null;
  var display  = null;
  var cancel   = null;

  var buddy    = 0;
  var preview  = null;
  var uploader = null;
  var actions  = null;
  var controls = null;
  var identity = null;
  var file     = null;

  /*- CONSTRUCTOR -*/
  connect(window, 'load', prepare);

  /*- MÉTODOS PÚBLICOS - EXPORTACIÓN -*/
  this.prepare_for_widget = prepare_for_widget;
  this.identify = identify;
  this.progress = progress;
  this.show = show;

  this.hide = hide;
  this.stop = stop;
  this.reset = reset;
  this.set = set;
  this.set_style = set_style;

  /*- MÉTODOS PRIVADOS -*/

  /* función para obtener la mejor representación visual de un número entre las unidades  */
  /* bytes, kilobytes, megabytes, gigabytes y terabytes */
  /* todo ::: aveces el resultado queda en notación científica */
  function get_best_unit(bytes) {
    var kilobytes = bytes/1024;
    var megabytes = kilobytes/1024;
    var gigabytes = megabytes/1024;
    var terabytes = gigabytes/1024;
    var best      = null;
    var unit      = null;

    if (bytes < 1024) {
      best = bytes;
      unit = 'b';
    } else if (kilobytes < 1024) {
      best = kilobytes;
      unit = 'kb';
    } else if (megabytes < 1024) {
      best = megabytes;
      unit = 'mb';
    } else if (gigabytes < 1024) {
      best = gigabytes;
      unit = 'gb';
    } else {
      best = terabytes;
      unit = 'tb';
    }

    return sprintf('%.02f %s', best, unit);
  }

  /* actualizar el valor de la transparencia (opacidad) para todos los navegadores */
  /* al aumentar el valor del divisor disminuye la opacidad y el acabo de la ventana es transparente a razón de 100/divisor */
  function update_opacity(element, divisor) {
    element.style.opacity      = opacity/divisor;
    element.style.MozOpacity   = opacity/divisor;
    element.style.KhtmlOpacity = opacity/divisor;
    element.style.filter       = 'progid:DXImageTransform.Microsoft.Alpha(opacity='+opacity*(100/divisor)+')';
  }
 
  /* obtener el url de la imagen cuando está cargada, sólo tiene sentido en IE */
  function get_target_thumbnail(file) {
    var basedir = '/uploader/cache/uploads';
    var postfix = '-thumbnail';
    var file_parts = null;
    var filename = null;
    var extension = null;

    file_parts = file.split('\\');
    filename = file_parts[file_parts.length-1];
    file_parts = filename.split('.');
    extension = file_parts[1];
  
    return basedir+'/'+id+postfix+'.'+extension;
  }
  
  /* animación de aparecimiento suave del diálodo de progreso */
  function show() {
    if (fading)
      clearTimeout(fading);
  
    dialog.style.zIndex = 1;
    opacity += IE ? 4 : 2; /* en IE lo acelero un poquito más */
    update_opacity(dialog, 125);
  
    if (opacity < 100)
      fading = setTimeout(show, IE ? 5 : 10);
  }
  
  /* animación de ocultamiento suave del diálodo de progreso */
  function hide() {
    if (fading)
      clearTimeout(fading);
  
    opacity -= IE ? 4 : 2; /* en IE lo acelero un poquito más */
    update_opacity(dialog, 125);
  
    if (opacity > 0)
      fading = setTimeout(hide, IE ? 5 : 10);
    else
      dialog.style.zIndex = -1;
  }
  
  /* poner la barra al n porciento */
  function set(n_percent) {
    if (n_percent < 100)
      bar.style.width = Math.round(WIDTH*n_percent/100)+'px'; /* todo => avanzar suavemente hacia adelante */
    else
      bar.style.width = WIDTH+'px';
  
    percent.innerHTML = n_percent.toPrecision(3)+'% completed';
  }
  
  /* poner la barra en 0 */
  function reset() {
    set(0);
  }

	function dummy() {
		/* dummy */
	}

	function on_resize_done() {
     display.innerHTML = 'done';
     set(100);
     hide();
     /* poner la imágen recién subida dentro del widget contenedor */ /* xxx ::: sincronizar en widget */
     var content = document.getElementById('c0001-content-'+buddy);
     var width = IE ? '142' : '148';
     source = get_target_thumbnail(file.value);
     /* todo:hardcode=>code ::: medir el widget y hacer la imágen del mismo tamaño */
     content.innerHTML = '<img id="c0001-preview-'+buddy+'" src="'+source+'" width="'+width+'" height="158">';
     actions.style.display = 'inline';
     controls.style.visibility = 'visible';
     preview = document.getElementById('c0001-preview-'+buddy);
	}
  
  /* función que se ejecuta cuando el servidor nos informa acerca del estado de la subida */
  function update() {
    var result = request.responseText;
    var json = '('+result+')';
    var progress = null;

		try {
      progress = eval(json);
    } catch (error) {
      clearTimeout(timer);
      return;
    }
  
    var state = progress.state; /* starting, error (status), done, uploading (size, received, speed) */

    if (!state) {
			alert ("Possible JSON parser error");
      state == 'error';
		}
  
    if (state == 'starting') { /* comienzo */
      reset();
      display.innerHTML = state;
    }
  
    if (state == 'uploading') { /* proceso */
      var size = progress.size;
      var received = progress.received;
      var speed = progress.speed;
      var n_percent = received/size*100;

      size = get_best_unit(size);
      received = get_best_unit(received);
      speed = get_best_unit(speed);

      set(n_percent);

      display.innerHTML = received+' of '+size+' at '+speed+'ps';
    }
  
    if (state == 'done') { /* fin del proceso, salió bien */
      clearTimeout(timer);
      display.innerHTML = 'resizing';
    	var extension = get_extension(file.value);

			/* NOTA: XMLHttpRequest ya tiene conectada una retrollamada. Por eso hago el pedido e
			 * con una función dummy(). El resultado del pedido se maneja en esta misma función
			 * update() con el estado (state) redimensionado (resized). */
    	do_ajax_query('thumbnailer.php', 'id='+id+'&type='+extension, dummy); /* segunda parte */
    }

    if (state == 'error') { /* fin del proceso, hubo un error */
      clearTimeout(timer);
      display.innerHTML = progress.status; /* todo ::: mostrar en una división apropiada */
      cancel.innerHTML = 'Close';
      reset();
    }

   if (state == 'resized') { /* se redimensionó la imagen */
      //clearTimeout(timer);
			on_resize_done();
		}
  }
  
  /* consultar al servidor cómo va la descarga */
  function progress() {
    do_ajax_query_get(url, query+id, update);
    timer = setTimeout(progress, 2500);
  }
  
  /* cancelar una descarga  */
  function stop() {
    var target = document.getElementById(id);
    if (target)
      target.src = 'about:blank'; /* cancelar el pedido (post) */
    clearTimeout(timer); /* dejar de solicitar el estado */
    display.innerHTML = 'cancelled';
    reset(); /* poner los contadores a cero */
    hide(); /* cerrar la ventana */
    preview.src = 'images/missing.gif';
  }
  
  /* cambiar el fondo animado de la barra de progreso */
  function set_style(style) {
    var progress = document.getElementById('c0001-progress');
    progress.style.background = 'url(images/styles/'+style+'.gif)';
  }
  
  /* generar un id único para identificar la carga */
  function identify() {
    id = 0;
  
    for (var i = 0; i < 32; i++)
      id += Math.floor(16*Math.random()).toString(16);
  
    /* crear una división anónima con el iframe identificado por id para usarlo como destino del formulario */
    var division = document.createElement('div');
    division.innerHTML = '<iframe style="display:none" id="'+id+'" name="'+id+'"></iframe>';
    document.body.appendChild(division);
  
    /* privadas */
    var action_parts = uploader.action.split('?');
    var action = action_parts[0];
  
    uploader.action = action+'?'+query+id;
    uploader.target = id;
    identity.value = id;
  }

  function prepare_for_widget(id) {
    preview = document.getElementById('c0001-preview-'+id);
    uploader = document.getElementById('c0001-uploader-'+id);
    actions = document.getElementById('c0001-actions-'+id);
    controls = document.getElementById('c0001-controls-'+id);
    identity = document.getElementById('c0001-identity-'+id);
    file = document.getElementById('c0001-file-'+id);
    buddy = id;
    center_dialog(dialog);
  }
    
  /* preparar el componente */
  function prepare() {
    /* inicializar globales */
    dialog = document.getElementById('c0001-dialog');
    bar = document.getElementById('c0001-bar');
    percent = document.getElementById('c0001-percent');
    display = document.getElementById('c0001-display');
    cancel = document.getElementById('c0001-cancel');
 
    center_dialog(dialog);

    if (IE) {
      var progress = document.getElementById('c0001-progress');
      WIDTH += 2;
      progress.style.height = '22px';
      progress.style.width  = WIDTH+'px'
    }
  
    cancel.innerHTML = 'Cancel';
  
    connect(cancel, 'click', stop);
  }
}

var default_profile = -1;

/* El widget de previsualización de la imágen */
function Widget(id, dialog) {
  /*- PROPIEDADES PRIVADAS -*/
  var widget = null;
  var content = null;
  var preview = null;
  var uploader = null;
  var identity = null;
  var file = null;
  var actions = null;
  var edit = null;
  var erase = null;
  var controls = null;
  var options = null;
  var combo = null;
  var selected = null;
  var set_inactive = null;
  var set_public = null;
  var set_private = null;
  var set_default = null;
  var edit_form = null;
  var comment = null;
  var save = null;
  var holder = null;

  /* extensiones disponibles */
  var EXTENSIONS = new Array('png', 'jpg', 'jpeg', 'bmp', 'gif');

  /*- CONSTRUCTOR -*/
  prepare();

  /*- MÉTODOS PÚBLICOS - EXPORTACIÓN -*/
  this.start = start;
  this.set_image = set_image;
  this.unset_default = unset_default;

  /*- MÉTODOS PRIVADOS -*/

  /* comienzo del circo, el diálogo sabe como detenerse, sólo defino cómo empezar */
  function start() {
    var extension = get_extension(file.value);
    var ok = false;
  
    /* verificar si la imágen tiene una extansión válida */
    for (var i = 0; i < EXTENSIONS.length; i++)
      if (extension == EXTENSIONS[i]) {
        ok = true;
        break;
      }
  
    /* si la imagen no tiene una extensión válida aviso y vuelvo sin hacer nada */
    if (!ok) {
      alert('The file does not seem a valid image');
      return;
    }
  
    preview.src = 'images/processing.gif';
    dialog.prepare_for_widget(id);
    dialog.show(); /* mostrar la ventana */
    dialog.identify(); /* identificar la carga (generar un identificador único) */
    dialog.progress(); /* comenzar a solicitar el estado de la carga */
    uploader.submit(); /* comenzar el pedido (post) */
  }

  function set_image(image) {
    var width = IE ? '142' : '148';
    var base  = '/uploader/cache/uploads';
    /* todo:hardcode=>code ::: medir el widget y hacer la imágen del mismo tamaño */
    content.innerHTML = '<img id="c0001-preview-'+id+'" src="'+base+'/'+image+'" width="'+width+'" height="158">';
    actions.style.display = 'inline';
    controls.style.visibility = 'visible';
    preview = document.getElementById('c0001-preview-'+id);
  }

  function unset_default() {
    set_default.className = 'c0001 default';
    default_profile = -1;
  }

  function on_edit_click() {
    edit_form.style.display = 'inline'; /* todo ::: animar caída */
  }

  function on_erase_done() {
    controls.style.visibility = 'hidden'; /* todo ::: animar subida */
    actions.style.display = 'none';
    edit_form.style.display = 'none';
    content.innerHTML = holder;
    prepare_file_input();
    erase.innerHTML = '<img src="images/close.gif">';
  }

  function on_erase_click() {
    erase.innerHTML = '<img src="images/micro-loader.gif">';
    do_ajax_query('dummy.php', 'id='+id, on_erase_done);
  }

  function on_combo_click() {
    if (options.style.display == 'none') {
      options.style.display = 'inline'; /* todo ::: animar caída */
      selected.innerHTML = '<i>Select</i>';
      selected.style.color = 'gray';
    } else {
      options.style.display = 'none'; /* todo ::: animar subida */
      selected.innerHTML = 'Inactive';
      selected.style.color = 'white';
    }
  }

  function on_set_inactive_done() {
    var result = request.responseText;
    selected.innerHTML = 'Inactive';
    selected.style.color = 'white';
  }

  function on_set_inactive_click() {
    options.style.display = 'none';
    selected.innerHTML = '<i>Setting...</i>';
    selected.style.color = 'gray';
    do_ajax_query('dummy.php', 'id='+id, on_set_inactive_done);
  }

  function on_set_private_done() {
    var result = request.responseText;
    selected.innerHTML = 'Private';
    selected.style.color = 'white';
  }

  function on_set_private_click() {
    options.style.display = 'none';
    selected.innerHTML = '<i>Setting...</i>';
    selected.style.color = 'gray';
    do_ajax_query('dummy.php', 'id='+id, on_set_private_done);
  }

  function on_set_public_done() {
    var result = request.responseText;
    selected.innerHTML = 'Public';
    selected.style.color = 'white';
  }

  function on_set_public_click() {
    options.style.display = 'none';
    selected.innerHTML = '<i>Setting...</i>';
    selected.style.color = 'gray';
    do_ajax_query('dummy.php', 'id='+id, on_set_public_done);
  }

  function on_set_default_done() {
    var result = request.responseText;
    var result = request.responseText;
    set_default.innerHTML = 'Set as profile image';
    set_default.style.color = 'white';
    set_default.className += ' setted';
  }

  function on_set_default_click() {
    default_profile.unset_default();
    /* todo => sólo válido para esta implementación */
    /* hay que portar implementando un referenciamiento por lista global */
    default_profile = eval('widget_'+id);
    set_default.innerHTML = '<i>Setting...</i>';
    set_default.style.color = 'gray';
    do_ajax_query('dummy.php', 'id='+id, on_set_default_done);
  }

  function on_save_done() {
    var result = request.responseText;
    edit_form.style.display = 'none'; /* todo ::: animar subida */
    save.innerHTML = 'Save';
    save.style.color = 'white';
    comment.disabled = false;
    edit.innerHTML = '<img src="images/edit.gif">';
  }

  function on_save_click() {
    edit.innerHTML = '<img src="images/micro-loader.gif">';
    save.innerHTML = '<i>Saving...</i>';
    save.style.color = 'gray';
    comment.disabled = true;
    do_ajax_query('dummy.php', 'id='+id, on_save_done);
  }

  if (IE) {
    function on_edit_mouse_over()         { edit.style.background         = '#3a2f27'; } /* :hover */
    function on_edit_mouse_out()          { edit.style.background         = '#544837'; }
    function on_erase_mouse_over()        { erase.style.background        = '#3a2f27'; } /* :hover */
    function on_erase_mouse_out()         { erase.style.background        = '#544837'; }
    function on_set_inactive_mouse_over() { set_inactive.style.background = '#3a2f27'; } /* :hover */
    function on_set_inactive_mouse_out()  { set_inactive.style.background = '#544837'; }
    function on_set_private_mouse_over()  { set_private.style.background  = '#3a2f27'; } /* :hover */
    function on_set_private_mouse_out()   { set_private.style.background  = '#544837'; }
    function on_set_public_mouse_over()   { set_public.style.background   = '#3a2f27'; } /* :hover */
    function on_set_public_mouse_out()    { set_public.style.background   = '#544837'; }
  }

  function prepare_file_input() {
    preview = document.getElementById('c0001-preview-'+id);
    uploader = document.getElementById('c0001-uploader-'+id);
    identify = document.getElementById('c0001-identity-'+id);
    file = document.getElementById('c0001-file-'+id);
    file.value = '';
    stylize(file);
    connect(file, 'change', start);
  }

  function prepare() {
    widget = document.getElementById('c0001-widget-'+id);
    content = document.getElementById('c0001-content-'+id);
    actions = document.getElementById('c0001-actions-'+id);
    edit = document.getElementById('c0001-edit-'+id);
    erase = document.getElementById('c0001-erase-'+id);
    controls = document.getElementById('c0001-controls-'+id);
    options = document.getElementById('c0001-options-'+id);
    combo = document.getElementById('c0001-combo-'+id);
    selected = document.getElementById('c0001-selected-'+id);
    set_inactive = document.getElementById('c0001-set-inactive-'+id);
    set_public = document.getElementById('c0001-set-public-'+id);
    set_private = document.getElementById('c0001-set-private-'+id);
    set_default = document.getElementById('c0001-set-default-'+id);
    edit_form = document.getElementById('c0001-edit-form-'+id);
    comment = document.getElementById('c0001-comment-'+id);
    save = document.getElementById('c0001-save-'+id);
  
    holder = content.innerHTML;

    connect(edit, 'click', on_edit_click);
    connect(erase, 'click', on_erase_click);
    connect(combo, 'click', on_combo_click);
    connect(set_default, 'click', on_set_default_click);
    connect(set_inactive, 'click', on_set_inactive_click);
    connect(set_private, 'click', on_set_private_click);
    connect(set_public, 'click', on_set_public_click);
    connect(save, 'click', on_save_click);

    prepare_file_input();

    if (IE) {
      actions.style.left = '147px';
      controls.style.borderTop = 'none';
      edit.style.height = '20px';
      erase.style.height = '20px';
      selected.style.paddingTop = '0px';
      options.style.paddingLeft = '0px';
      options.style.marginLeft = '0px';
      options.style.width = '134px';
      set_default.style.marginBottom = '3px';
      comment.style.width = '135px';
      comment.style.marginLeft = '1px';

      connect(edit, 'mouseover', on_edit_mouse_over);
      connect(edit, 'mouseout', on_edit_mouse_out);
      connect(erase, 'mouseover', on_erase_mouse_over);
      connect(erase, 'mouseout', on_erase_mouse_out);
      connect(set_inactive, 'mouseover', on_set_inactive_mouse_over);
      connect(set_inactive, 'mouseout', on_set_inactive_mouse_out);
      connect(set_private, 'mouseover', on_set_private_mouse_over);
      connect(set_private, 'mouseout', on_set_private_mouse_out);
      connect(set_public, 'mouseover', on_set_public_mouse_over);
      connect(set_public, 'mouseout', on_set_public_mouse_out);
    } else
      controls.style.marginTop = '158px';
  }
}

var progress_dialog = new ProgressDialog();
