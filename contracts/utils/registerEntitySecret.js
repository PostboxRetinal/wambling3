import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";

const response = await registerEntitySecretCiphertext(
    {
      apiKey: 'TEST_API_KEY:2c6ddb72a8f62d3c2591910748eb4216:f11d5d0d650bfcb57b3b9a1be211b671',
      entitySecret: 'e40246420b79db0e7f2637b2173f801d701d63868372277f3242fe340f457d17'
    }
  );
  fs.writeFileSync(
    'recovery_file.dat',
    response.data?.recoveryFile ?? '',
  )