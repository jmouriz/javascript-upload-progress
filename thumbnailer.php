<?php
	$folder = "/var/www/uploader/cache/uploads";
	$imsize =  "200x200";

	$fileid =  $_POST["id"];
	$format =  $_POST["type"];
	$source =  "$folder/$fileid.$format";
	$target =  "$folder/$fileid-thumbnail.$format";

   // Esto no es muy correcto, depende un programa externo y se puede escribir en PHP puro.
	system ("/usr/bin/convert -resize $imsize \"$source\" \"$target\"");

   // Si el archivo es muy chico, se puede añadir un retraso aquí para simular que es más grande.
	//system ("sleep 5");

	//unlink ($source);

	echo '{ "state" : "resized" }';
?>
