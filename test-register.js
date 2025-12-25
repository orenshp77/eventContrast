// Test registration API
const testRegister = async () => {
  try {
    console.log('Testing registration API...');

    const response = await fetch('http://localhost:10001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test' + Date.now() + '@test.com',
        password: 'password123',
        businessName: 'Test Business',
        businessPhone: '0501234567',
      }),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', data.message);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Make sure the server is running on port 10001');
  }
};

testRegister();
