import { validateEnvironment, getAPIKeyInstructions } from './config/environment.js';

// Environment setup validator and helper
export const runSetupCheck = () => {
  console.log('🚀 Echo News Setup Validator\n');
  
  const validation = validateEnvironment();
  
  if (validation.isValid) {
    console.log('✅ All environment variables are configured correctly!');
    console.log('🎉 You can start using Echo News.');
    return true;
  }
  
  console.log('❌ Setup incomplete. Please configure the following:\n');
  
  if (validation.missingVars.length > 0) {
    console.log('📋 Missing Environment Variables:');
    validation.missingVars.forEach(({ key, description }) => {
      console.log(`  ❌ ${key}: ${description}`);
    });
    console.log('');
  }
  
  if (validation.invalidVars.length > 0) {
    console.log('🔧 Invalid Environment Variables (using placeholders):');
    validation.invalidVars.forEach(({ key, description }) => {
      console.log(`  ⚠️  ${key}: ${description}`);
    });
    console.log('');
  }
  
  console.log('📖 API Key Setup Instructions:');
  console.log('=====================================\n');
  
  const instructions = getAPIKeyInstructions();
  
  Object.entries(instructions).forEach(([key, config]) => {
    console.log(`🔑 ${config.title}:`);
    config.instructions.forEach(instruction => {
      console.log(`   ${instruction}`);
    });
    console.log(`   📚 Documentation: ${config.docs}\n`);
  });
  
  console.log('💡 After setting up your API keys:');
  console.log('   1. Update your .env file with the actual values');
  console.log('   2. Restart the development server (npm start)');
  console.log('   3. Run this validator again to confirm setup\n');
  
  return false;
};

// Auto-run setup check in development
if (process.env.NODE_ENV === 'development') {
  runSetupCheck();
}

export default { runSetupCheck };
