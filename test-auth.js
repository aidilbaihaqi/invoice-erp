// Test Authentication Script
// Run with: node test-auth.js

const SUPABASE_URL = 'https://qwxtajsfwowbsbtmzlsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eHRhanNmd293YnNidG16bHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDM1MzEsImV4cCI6MjA4NDExOTUzMX0.CsS1oj8Ps8v5BM6tFO9VjyeUg_b0VxMaVc11iLqnleY';

async function testAuth() {
    console.log('🔐 Testing Supabase Authentication\n');
    console.log('='.repeat(50));

    // Test 1: Sign Up
    console.log('\n1️⃣  Testing Sign Up...');
    const timestamp = Math.floor(Date.now() / 1000);
    const signUpEmail = `testuser${timestamp}@gmail.com`;
    const signUpPassword = 'test123456';
    
    try {
        const signUpResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                email: signUpEmail,
                password: signUpPassword,
                data: {
                    full_name: 'Test User'
                }
            })
        });

        const signUpData = await signUpResponse.json();
        
        if (signUpResponse.ok) {
            console.log('✅ Sign Up Success!');
            console.log('   User ID:', signUpData.user?.id);
            console.log('   Email:', signUpData.user?.email);
            console.log('   Confirmed:', signUpData.user?.confirmed_at ? 'Yes' : 'No (email confirmation required)');
        } else {
            console.log('❌ Sign Up Failed:', signUpData.msg || signUpData.error_description);
        }
    } catch (error) {
        console.log('❌ Sign Up Error:', error.message);
    }

    // Test 2: Sign In
    console.log('\n2️⃣  Testing Sign In...');
    
    try {
        const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                email: signUpEmail,
                password: signUpPassword
            })
        });

        const signInData = await signInResponse.json();
        
        if (signInResponse.ok && signInData.access_token) {
            console.log('✅ Sign In Success!');
            console.log('   User ID:', signInData.user?.id);
            console.log('   Email:', signInData.user?.email);
            console.log('   Access Token:', signInData.access_token.substring(0, 30) + '...');
            
            // Test 3: Create Customer with Auth
            console.log('\n3️⃣  Testing Create Customer (with auth)...');
            
            const customerResponse = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${signInData.access_token}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name: 'Test Customer',
                    address: 'Test Address',
                    phone: '081234567890',
                    email: 'customer@test.com',
                    user_id: signInData.user.id
                })
            });

            const customerData = await customerResponse.json();
            
            if (customerResponse.ok) {
                console.log('✅ Customer Created!');
                console.log('   Customer ID:', customerData[0]?.id);
                console.log('   Name:', customerData[0]?.name);
                console.log('   User ID:', customerData[0]?.user_id);
            } else {
                console.log('❌ Customer Creation Failed:', customerData.message || customerData.hint);
            }

            // Test 4: List Customers (should only see own data)
            console.log('\n4️⃣  Testing List Customers (RLS check)...');
            
            const listResponse = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${signInData.access_token}`
                }
            });

            const listData = await listResponse.json();
            
            if (listResponse.ok) {
                console.log('✅ List Customers Success!');
                console.log('   Found:', listData.length, 'customer(s)');
                console.log('   Data:', JSON.stringify(listData, null, 2));
            } else {
                console.log('❌ List Failed:', listData.message);
            }

            // Test 5: Check User Profile
            console.log('\n5️⃣  Testing User Profile...');
            
            const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${signInData.user.id}&select=*`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${signInData.access_token}`
                }
            });

            const profileData = await profileResponse.json();
            
            if (profileResponse.ok) {
                console.log('✅ User Profile Found!');
                console.log('   Profile:', JSON.stringify(profileData, null, 2));
            } else {
                console.log('❌ Profile Check Failed:', profileData.message);
            }

        } else {
            console.log('❌ Sign In Failed:', signInData.msg || signInData.error_description);
            console.log('   Note: Email confirmation might be required. Check Supabase Dashboard > Authentication > Settings');
        }
    } catch (error) {
        console.log('❌ Sign In Error:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Test Complete!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Open http://localhost:5174/ in your browser');
    console.log('   2. Try signing up with a new account');
    console.log('   3. Create some customers, items, invoices');
    console.log('   4. Sign out and sign in with different account');
    console.log('   5. Verify data isolation (each user sees only their data)');
    console.log('\n💡 Tip: If email confirmation is blocking, disable it in:');
    console.log('   Supabase Dashboard > Authentication > Settings > Email Auth');
}

testAuth().catch(console.error);
