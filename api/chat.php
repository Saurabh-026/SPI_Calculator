<?php
require_once '../config/database.php';

// --- IMPORTANT: PASTE YOUR NEW, SECRET GEMINI API KEY HERE ---
$apiKey = 'AIzaSyA1R2R8rtlHMW_R15CN8A67v3cKBpBmYL0';

// Get the user's message from the frontend's request
$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';

if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message cannot be empty.']);
    exit();
}

// Set the API endpoint with a valid and current model name
$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// Prepare the data payload to send to the Gemini API
$data = [
    'contents' => [
        [
            'parts' => [
                ['text' => $userMessage]
            ]
        ]
    ]
];
$json_data = json_encode($data);

// Use cURL to send the request to the Google API
$ch = curl_init($url);

// Set the cURL options, including sending the API key in the header
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-goog-api-key: ' . $apiKey // Sending the key securely in the header
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For local XAMPP setup
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);    // Stop trying to connect after 10 seconds
curl_setopt($ch, CURLOPT_TIMEOUT, 15);           // Total request timeout of 15 seconds

$result = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL Error: ' . curl_error($ch)]);
    curl_close($ch);
    exit();
}

curl_close($ch);

// Decode the response from Google
$response = json_decode($result, true);

// Check for errors returned by the Gemini API itself
if (isset($response['error'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Gemini API Error: ' . $response['error']['message']]);
    exit();
}

// Safely extract the chat message from the response
$geminiMessage = $response['candidates'][0]['content']['parts'][0]['text'] ?? 'Sorry, I could not process that response.';

// Send the final message back to your frontend
echo json_encode(['reply' => $geminiMessage]);

?>