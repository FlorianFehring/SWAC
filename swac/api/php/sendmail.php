<?php
set_error_handler(function() {
    echo "{\"error\":\"Could not send mail.\"}";
    http_response_code(500);
});

$contents = file_get_contents('php://input');
if (!empty($contents)) {
    $data = json_decode($contents, true);
    $toEmail = "fekom@gmx.de";

    if ($data["name"] != null) {
        $name = $data["name"];
    } else {
        $name = "SWAC api_sendmail";
    }
    if ($data["email"] != null) {
        $email = $data["email"];
    } else {
        $email = "noreply@swac.de";
    }
    if ($data["subject"] != null) {
        $subject = $data["subject"];
    } else {
        $subject = "Message over SWAC api_sendmail";
    }

    // CRLF Injection attack protection
    $name = strip_crlf($name);
    $email = strip_crlf($email);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "The email address >". $email ."< is invalid.";
    } else {
        // appending \r\n at the end of mailheaders for end
        $mailHeaders = "From: " . $name . "<" . $email . ">\r\n";
        if (mail($toEmail, $subject, $contents, $mailHeaders)) {
            $message = "Your contact information is received successfully.";
            $type = "success";
        }
    }
} else {
    echo "{}";
}

function strip_crlf($string) {
    return str_replace("\r\n", "", $string);
}

restore_error_handler();
?>