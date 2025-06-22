import fetch from 'node-fetch';
import chalk from 'chalk';
import { promises as fs, readFileSync } from 'fs';
import { faker } from '@faker-js/faker';

// Load configuration
const config = JSON.parse(readFileSync('./wavespeed-config.json', 'utf-8'));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get random user agent
const getRandomUserAgent = () => {
  const randomIndex = Math.floor(Math.random() * config.userAgents.length);
  return config.userAgents[randomIndex];
};

// Generate temporary email using temp-mail.io API
const generateTempEmail = async () => {
  try {
    const url = 'https://api.internal.temp-mail.io/api/v3/email/new';
    const headers = {
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'en-US,en;q=0.9',
      'application-name': 'web',
      'application-version': '4.0.0',
      'content-type': 'application/json',
      'origin': 'https://temp-mail.io',
      'referer': 'https://temp-mail.io/',
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
    console.error(chalk.red(`Error generating email: ${error.message}`));
    return null;
  }
};

// Get verification code from email
const getVerificationCode = async (email) => {
  const maxAttempts = 12;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const url = `https://api.internal.temp-mail.io/api/v3/email/${email}/messages`;
      const headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'application-name': 'web',
        'application-version': '4.0.0',
        'origin': 'https://temp-mail.io',
        'referer': 'https://temp-mail.io/',
        'user-agent': getRandomUserAgent(),
        'x-cors-header': 'iaWg3pchvFx48fY',
      };

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const messages = await response.json();

      if (messages && messages.length > 0) {
        const latestMessage = messages[0];
        const subject = latestMessage.subject || '';
        const bodyText = latestMessage.body_text || '';
        const bodyHtml = latestMessage.body_html || '';

        // Look for verification code patterns
        const fullText = subject + bodyText + bodyHtml;
        const codeMatch = fullText.match(/\b\d{4,8}\b/);
        
        if (codeMatch) {
          console.log(chalk.green(`✓ Verification code found: ${codeMatch[0]}`));
          return codeMatch[0];
        }
      }

      console.log(chalk.yellow(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Waiting for verification email...`));
      attempts++;
      await delay(5000);
    } catch (error) {
      console.error(chalk.red(`Error checking email: ${error.message}`));
      attempts++;
      await delay(5000);
    }
  }

  console.error(chalk.red('❌ Max attempts reached. No verification code found.'));
  return null;
};

// Register account on wavespeed.ai
const registerAccount = async (email, password, referralCode) => {
  try {
    console.log(chalk.blue(`📝 Registering account for: ${email}`));
    
    // Generate random user data
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.username().toLowerCase();

    // First, try to get the registration page to understand the form structure
    const registrationUrl = referralCode 
      ? `https://wavespeed.ai/register?ref=${referralCode}`
      : 'https://wavespeed.ai/register';

    console.log(chalk.blue(`🔗 Using registration URL: ${registrationUrl}`));

    // Get registration page
    const pageResponse = await fetch(registrationUrl, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to load registration page: ${pageResponse.status}`);
    }

    // Attempt registration (this is a generic approach - may need adjustment based on actual API)
    const registrationData = {
      email: email,
      password: password,
      password_confirmation: password,
      first_name: firstName,
      last_name: lastName,
      username: username,
      referral_code: referralCode || '',
      terms: true,
      newsletter: false
    };

    console.log(chalk.blue(`👤 Generated user: ${firstName} ${lastName} (${username})`));

    // Try common registration endpoints
    const possibleEndpoints = [
      'https://wavespeed.ai/api/register',
      'https://wavespeed.ai/register',
      'https://api.wavespeed.ai/register',
      'https://wavespeed.ai/auth/register'
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(chalk.blue(`🔄 Trying endpoint: ${endpoint}`));
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://wavespeed.ai',
            'Referer': registrationUrl,
          },
          body: JSON.stringify(registrationData),
        });

        const responseText = await response.text();
        console.log(chalk.gray(`Response status: ${response.status}`));
        console.log(chalk.gray(`Response: ${responseText.substring(0, 200)}...`));

        if (response.ok) {
          try {
            const data = JSON.parse(responseText);
            return { success: true, data, endpoint };
          } catch {
            return { success: true, data: responseText, endpoint };
          }
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Endpoint ${endpoint} failed: ${error.message}`));
        continue;
      }
    }

    throw new Error('All registration endpoints failed');

  } catch (error) {
    console.error(chalk.red(`❌ Registration error: ${error.message}`));
    return { success: false, error: error.message };
  }
};

// Verify email if needed
const verifyEmail = async (email, verificationCode) => {
  try {
    console.log(chalk.blue(`✉️ Verifying email with code: ${verificationCode}`));
    
    const possibleEndpoints = [
      'https://wavespeed.ai/api/verify-email',
      'https://wavespeed.ai/verify',
      'https://api.wavespeed.ai/verify-email',
      'https://wavespeed.ai/auth/verify'
    ];

    const verificationData = {
      email: email,
      code: verificationCode,
      verification_code: verificationCode,
      token: verificationCode
    };

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/json',
          },
          body: JSON.stringify(verificationData),
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      } catch (error) {
        continue;
      }
    }

    return { success: false, error: 'Verification failed' };
  } catch (error) {
    console.error(chalk.red(`❌ Verification error: ${error.message}`));
    return { success: false, error: error.message };
  }
};

// Save successful account
const saveAccount = async (email, password, referralCode) => {
  const accountData = `${email}|${password}|${referralCode}\n`;
  await fs.writeFile('wavespeed-accounts.txt', accountData, { flag: 'a' });
  console.log(chalk.green(`💾 Account saved: ${email}`));
};

// Main execution function
const createReferralAccounts = async () => {
  const accountCount = process.argv[2] ? parseInt(process.argv[2]) : config.maxAccounts;
  const referralCode = process.argv[3] || config.referralCode;

  if (!referralCode || referralCode === 'YOUR_REFERRAL_CODE_HERE') {
    console.error(chalk.red('❌ Please provide a referral code in config or as argument'));
    console.log(chalk.yellow('Usage: node wavespeed-referral.js [count] [referral_code]'));
    return;
  }

  console.log(chalk.cyan(`🚀 Starting Wavespeed.ai referral automation`));
  console.log(chalk.cyan(`📊 Target accounts: ${accountCount}`));
  console.log(chalk.cyan(`🔗 Referral code: ${referralCode}`));
  console.log(chalk.cyan(`⏱️ Delay between accounts: ${config.delayBetweenAccounts}ms`));

  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= accountCount; i++) {
    try {
      console.log(chalk.magenta(`\n🔄 [${i}/${accountCount}] Creating account...`));

      // Generate email
      const email = await generateTempEmail();
      if (!email) {
        console.log(chalk.red('❌ Failed to generate email, skipping...'));
        failCount++;
        continue;
      }

      console.log(chalk.green(`📧 Generated email: ${email}`));

      // Register account
      const registrationResult = await registerAccount(email, config.password, referralCode);
      
      if (registrationResult.success) {
        console.log(chalk.green(`✅ Registration successful!`));
        
        // Check if email verification is needed
        if (registrationResult.data && 
            (JSON.stringify(registrationResult.data).includes('verify') || 
             JSON.stringify(registrationResult.data).includes('confirmation'))) {
          
          console.log(chalk.blue(`📬 Email verification required, waiting for code...`));
          
          const verificationCode = await getVerificationCode(email);
          if (verificationCode) {
            const verifyResult = await verifyEmail(email, verificationCode);
            if (verifyResult.success) {
              console.log(chalk.green(`✅ Email verified successfully!`));
            } else {
              console.log(chalk.yellow(`⚠️ Email verification failed, but account may still be created`));
            }
          }
        }

        // Save account
        await saveAccount(email, config.password, referralCode);
        successCount++;
        
      } else {
        console.log(chalk.red(`❌ Registration failed: ${registrationResult.error}`));
        failCount++;
      }

      // Delay before next account
      if (i < accountCount) {
        console.log(chalk.blue(`⏳ Waiting ${config.delayBetweenAccounts}ms before next account...`));
        await delay(config.delayBetweenAccounts);
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error in iteration ${i}: ${error.message}`));
      failCount++;
    }
  }

  // Final summary
  console.log(chalk.cyan(`\n📊 === FINAL SUMMARY ===`));
  console.log(chalk.green(`✅ Successful accounts: ${successCount}`));
  console.log(chalk.red(`❌ Failed accounts: ${failCount}`));
  console.log(chalk.blue(`📁 Accounts saved to: wavespeed-accounts.txt`));
  
  if (successCount > 0) {
    console.log(chalk.green(`🎉 Referral automation completed successfully!`));
  }
};

// Run the automation
createReferralAccounts().catch(error => {
  console.error(chalk.red(`💥 Fatal error: ${error.message}`));
  process.exit(1);
});