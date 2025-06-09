<?php
header("Access-Control-Allow-Origin: *");
$url = $_GET['url'];
//echo "url:" . $url;
echo file_get_contents($url);
?>