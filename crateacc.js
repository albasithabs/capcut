import fetch from 'node-fetch';
import chalk from 'chalk';
import { promises as fs, readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

function encryptToTargetHex(input) {
  let hexResult = '';
  for (const char of input) {
    const encryptedCharCode = char.charCodeAt(0) ^ 0x05;
    hexResult += encryptedCharCode.toString(16).padStart(2, '0');
  }
  return hexResult;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Daftar user agent acak
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36',
];

// Fungsi untuk mendapatkan user agent acak
const getRandomUserAgent = () => {
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
};

// Fungsi untuk menghasilkan email baru menggunakan API (tanpa proxy)
const generateNewEmail = async () => {
  try {
    const url = 'https://api.internal.temp-mail.io/api/v3/email/new';
    const headers = {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'id,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
      'application-name': 'web',
      'application-version': '4.0.0',
      'content-type': 'application/json',
      'origin': 'https://temp-mail.io',
      'priority': 'u=1, i',
      'referer': 'https://temp-mail.io/',
      'sec-ch-ua': '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': getRandomUserAgent(),
      'x-cors-header': 'iaWg3pchvFx48fY',
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({}),
    });
    const data = await response.json();
    return data.email || null;
  } catch (error) {
    console.error(chalk.red(`Error generating new email: ${error.message}`));
    return null;
  }
};

// Fungsi untuk mengambil pesan verifikasi menggunakan API (tanpa proxy)
const getVerificationMessage = async (email) => {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `https://api.internal.temp-mail.io/api/v3/email/${email}/messages`;
      const headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'id,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
        'application-name': 'web',
        'application-version': '4.0.0',
        'content-type': 'application/json',
        'origin': 'https://temp-mail.io',
        'priority': 'u=1, i',
        'referer': 'https://temp-mail.io/',
        'sec-ch-ua': '"Chromium";v="136", "Microsoft Edge";v="136", "Not.A/Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': getRandomUserAgent(),
        'x-cors-header': 'iaWg3pchvFx48fY',
      };
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      const messages = await response.json();

      if (messages && messages.length > 0) {
        // Ambil pesan terbaru
        const latestMessage = messages[0];
        const subject = latestMessage.subject || '';
        const bodyText = latestMessage.body_text || '';

        const codeMatch = (subject + bodyText).match(/\d{6}/);
        if (codeMatch) {
          console.log(chalk.blue(`Verification Code: ${codeMatch[0]}`));
          return codeMatch[0];
        }
      } else {
        console.log(chalk.blue(`Verification message attempt: No messages found`));
      }

      console.log(chalk.yellow(`Attempt ${attempts + 1}/${maxAttempts}: No verification code yet, retrying...`));
      attempts++;
      await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
    } catch (err) {
      console.error(chalk.red(`Attempt ${attempts + 1}/${maxAttempts}: Error getting verification message: ${err.message}`));
      attempts++;
      await delay(5000);
    }
  }

  console.error(chalk.red('Max attempts reached. No verification code found.'));
  return null;
};

// Fungsi untuk mendapatkan email acak (tanpa proxy)
const getEmailRandom = async () => {
  const maxAttempts = 20; // Total percobaan
  const maxTotalLength = 22; // Total karakter maksimum yang diizinkan
  let attempts = 0;

  while (attempts < maxAttempts) {
    console.log(chalk.blue(`Attempt ${attempts + 1}/${maxAttempts}: Generating email...`));
    // Menghasilkan email baru menggunakan API
    const newEmail = await generateNewEmail();
    if (!newEmail) {
      console.log(chalk.red('Failed to generate new email via API, retrying...'));
      attempts++;
      continue;
    }

    const emailTrimmed = newEmail.trim();
    const [username, domain] = emailTrimmed.split('@');
    const totalLength = emailTrimmed.length;

    // Validasi username: 7 hingga 15 karakter
    if (
      username.length >= 7 &&
      username.length <= 15 &&
      domain.length <= 11 &&
      totalLength <= maxTotalLength
    ) {
      console.log(chalk.green(`Email accepted: ${emailTrimmed}`));
      return { email: emailTrimmed, domain };
    } else {
      console.log(
        chalk.yellow(
          `Attempt ${attempts + 1}/${maxAttempts}: Total characters: ${totalLength} (max allowed: ${maxTotalLength}), retrying...`
        )
      );
      attempts++;
    }
  }

  console.error(chalk.red('Failed to find a matching email after maximum attempts'));
  return null;
};

async function regist_sendRequest(encryptedEmail, encryptedHexPassword) {
  try {
    const url = new URL('https://www.capcut.com/passport/web/email/send_code/');
    const queryParams = {
      aid: '348188',
      account_sdk_source: 'web',
      language: 'en',
      verifyFp: 'verify_m7euzwhw_PNtb4tlY_I0az_4me0_9Hrt_sEBZgW5GGPdn',
      check_region: '1',
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const formData = new URLSearchParams();
    formData.append('mix_mode', '1');
    formData.append('email', encryptedEmail);
    formData.append('password', encryptedHexPassword);
    formData.append('type', '34');
    formData.append('fixed_mix_mode', '1');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': getRandomUserAgent(),
      },
      body: formData,
    });
    const data = await response.json();
    if (data.message !== 'success') {
      console.error(chalk.red(`Failed to create account: ${JSON.stringify(data)}`));
      return data;
    }
    return data;
  } catch (error) {
    console.error(chalk.red(`Error in regist_sendRequest: ${error.message}`));
    return { message: error.message };
  }
}

async function verify_sendRequest(encryptedEmail, encryptedHexPassword, encryptedCode) {
  try {
    const originalDate = new Date(1990, 0, 1);
    const formattedDate = originalDate.toISOString().split('T')[0];
    const url = new URL('https://www.capcut.com/passport/web/email/register_verify_login/');
    const queryParams = {
      aid: '348188',
      account_sdk_source: 'web',
      language: 'en',
      verifyFp: 'verify_m7euzwhw_PNtb4tlY_I0az_4me0_9Hrt_sEBZgW5GGPdn',
      check_region: '1',
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    const formData = new URLSearchParams();
    formData.append('mix_mode', '1');
    formData.append('email', encryptedEmail);
    formData.append('code', encryptedCode);
    formData.append('password', encryptedHexPassword);
    formData.append('type', '34');
    formData.append('birthday', formattedDate);
    formData.append('force_user_region', 'ID');
    formData.append('biz_param', '%7B%7D');
    formData.append('check_region', '1');
    formData.append('fixed_mix_mode', '1');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': getRandomUserAgent(),
      },
      body: formData,
    });
    const data = await response.json();
    if (data.message !== 'success') {
      console.error(chalk.red(`Failed to verify account: ${JSON.stringify(data)}`));
      return data;
    }
    return data;
  } catch (error) {
    console.error(chalk.red(`Error in verify_sendRequest: ${error.message}`));
    return { message: error.message };
  }
}

async function saveToFile(filename, data) {
  await fs.writeFile(filename, data, { flag: 'a' });
}

// Jalankan fungsi
(async () => {
  const loopCount = process.argv[2] ? parseInt(process.argv[2]) : 1;
  console.log(chalk.yellow(`Starting account creation loop (${loopCount} iterations)`));

  for (let i = 1; i <= loopCount; i++) {
    try {
      console.log(chalk.cyan(`\n[Account ${i}/${loopCount}]`));
      console.log(chalk.blue('Generating random email...'));

      const { email, domain } = await getEmailRandom();
      if (!email) {
        console.log(chalk.red('No valid email found, skipping iteration'));
        continue;
      }
      console.log(chalk.green(`Using email: ${email}`));
      const password = config.password;
      const encryptedHexEmail = encryptToTargetHex(email);
      const encryptedHexPassword = encryptToTargetHex(password);

      const reqnya = await regist_sendRequest(encryptedHexEmail, encryptedHexPassword);

      if (reqnya && reqnya.message === 'success') {
        console.log(chalk.blue('Waiting for verification email...'));

        const verificationCode = await getVerificationMessage(email);

        if (verificationCode) {
          console.log(chalk.green(`Verification Code: ${verificationCode}`));
          const encryptedHexCode = encryptToTargetHex(verificationCode);

          const verifyData = await verify_sendRequest(encryptedHexEmail, encryptedHexPassword, encryptedHexCode);

          if (verifyData && verifyData.message === 'success') {
            const walletData = `${email}|${password}\n`;
            await saveToFile('accounts.txt', walletData);
            console.log(chalk.green('Account saved successfully to accounts.txt'));
          } else {
            console.log(chalk.red(`Error verifying account: ${verifyData?.message || 'Unknown error'}`));
          }
        } else {
          console.log(chalk.red('Failed to retrieve verification code'));
        }
      } else {
        console.log(chalk.red(`Error creating account: ${reqnya?.message || 'Unknown error'}`));
      }

      // Tunggu sebelum iterasi berikutnya
      if (i < loopCount) {
        console.log(chalk.blue('Waiting before next iteration...'));
        await delay(5000); // Tunggu 5 detik sebelum iterasi berikutnya
      }
    } catch (error) {
      console.log(chalk.red(`Error in iteration ${i}: ${error.message}`));
    }
  }

  console.log(chalk.yellow('\nFinished all iterations!'));
})();