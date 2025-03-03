<?php
header('Content-Type: application/json');
/*set_error_handler(function() {
    echo "{\"error\":\"Could not send mail.\"}";
    http_response_code(500);
});*/

// Reciver of mails
$toEmail = "florian.fehring@weltenquell.de";
// Default message to answer script call with
$json_message = "";

$errors = [];

$contents = file_get_contents('php://input');
if (!empty($contents)) {
    $data = json_decode($contents, true);
    
    if ($data["name"] != null) {
        $sender_name = $data["name"];
    } else {
        $sender_name = $_SERVER['HTTP_HOST'];
    }
    if ($data["email"] != null) {
        $sender_email = $data["email"];
    } else {
        $sender_email = "noreply@" . $_SERVER['HTTP_HOST'];
    }
    if ($data["subject"] != null) {
        $subject = $data["subject"];
    } else {
		$refer = $_SERVER['HTTP_REFERER'];
		if(!$refer)
			$refer = "unknown page";
        $subject = "Message over " . $refer;
    }

    // CRLF Injection attack protection
    $name = strip_crlf($sender_name);
    $email = strip_crlf($sender_email);
    if (!filter_var($sender_email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "The email address >". $sender_email ."< is invalid.";
    } else {
        // appending \r\n at the end of mailheaders for end
        $mailHeaders = "From: " . $sender_name . "<" . $sender_email . ">\r\n";
		$mailresponse = mail($toEmail, $subject, $contents, $mailHeaders);
        if ($mailresponse) {
            $message = "Your contact information is received successfully.";
        } else {
			$errors[] = "Could not send mail. Mailresponse delivered: >" . $mailresponse . "<";
		}
    }
} else {
    $errors[] = "No data recived for sending.";
}

// Create response
$response = "{";
$response .= "\"message\":\"" . $message . "\",";
$response .= "\"errors\":" . json_encode($errors);
$response .= "}";

echo $response;

function strip_crlf($string) {
    return str_replace("\r\n", "", $string);
}

/*restore_error_handler();*/
?>