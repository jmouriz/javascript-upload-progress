<?php
	$folder = "/var/www/uploader/cache/uploads";

	$fileid =  $_POST["id"];
	$source =  $_FILES["file"]["tmp_name"];
	$target =  $_FILES["file"]["name"];
	$format =  strtolower (end (explode (".", $target)));
	$target = "$folder/$fileid.$format";

	if (move_uploaded_file ($source, $target))
	{
		echo "DONE";
	}
	else
	{
		echo "ERROR";
	}
?>
