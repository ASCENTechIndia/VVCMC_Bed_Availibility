

// const config = require('config'); // if needed
const isValidToken = require('./isValidToken');;
const { encryptPassword } = require('../../utils/login-password-crypto');

async function handlePageLoad(req, res) {
  console.log('\n📥 Incoming Request:', req.method, req.originalUrl);

  if (req.method === 'POST' && Object.keys(req.body).length > 0) {
    const domainAuthority = "nagarkaryavaliuat.com";
    const referrer = req.get('Referer') || '';

    console.log('🔍 Referrer header:', referrer);

    try {
      const urlObj = new URL(referrer);
      const refAuthority = urlObj.host;

      console.log('✅ Parsed refAuthority:', refAuthority);
      console.log('🔐 Expected domainAuthority:', domainAuthority);

      if (refAuthority === domainAuthority) {
        const { tokenno } = req.body;
        console.log('🆔 Token received:', tokenno);

        if (!tokenno) {
          console.warn('❌ Token missing in request body');
          return res.send('Invalid Token, Please Login With Your Credentials');
        }

        const result = await isValidToken(tokenno);
        console.log('🛡️ Token validation result:', result);

        if (result.isValid) {
          req.session.urlflag = 1;
          req.session.IsCalledPass = 'Y';
          req.session.userid = result.userid;
          req.session.password = encryptPassword(result.password);

          console.log('✅ Session set, redirecting to /autologin');
          return res.redirect('https://jwt.io/');
        } else {
          console.warn('❌ Invalid token or login failed');
          return res.send('Invalid token or login failed.');
        }

      } else {
        console.warn('🚫 Unauthorized referrer:', refAuthority);
        return res.send('<b>UNAUTHORISED REQUEST</b>!<br/>Please contact admin or login manually.');
      }

    } catch (err) {
      console.error('❗ Referrer URL parse error or other exception:', err.message);
      return res.status(500).send('Internal server error');
    }

  } else {
    console.log('🌐 GET request or empty POST - clearing session and rendering login');

    req.session.userid = '';
    req.session.password = '';
    return res.render('login', { username: '', password: '' });
  }
}

module.exports = handlePageLoad;
