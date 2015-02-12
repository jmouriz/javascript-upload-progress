Para poner en marcha el cargador, debe primero compilar el módulo mod_upload_progress para Apache de la siguiente manera:

cd uploader
apxs2 -c -i -a mod_upload_progress.c

Si no tiene la herramienta apxs2, instálela, generalmente viene en el paquete apache2-dev.

Una vez instalada cree el archivo /etc/apache2/mods-available/upload_progress.load con el siguiente contenido:

LoadModule upload_progress_module /usr/lib/apache2/modules/mod_upload_progress.so

Una vez creado el archivo, habilite el módulo creando un enlace simbólico:

ln -s /etc/apache2/mods-available/upload_progress.load /etc/apache2/mods-enabled/upload_progress.load

Luego configure el sitio donde quiere que funcione el cargador con las siguientes directivas:

<Location /uploader>
  # habilitar cargas en /uploader/cache/uploads
  TrackUploads On
</Location>

<Location /uploader/progress>
  # informar estado de transferencias en /uploader/progress
  ReportUploads On
</Location>
