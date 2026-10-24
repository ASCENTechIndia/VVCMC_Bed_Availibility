const crypto = require('crypto');
const CryptoJS = require('crypto-js');


const EncryptionKey = process.env.LOGIN_ENCRYPTION_KEY;;

// Encrypt password using TripleDES
const encryptPassword = (password) => {
    try {
        // console.log("encryptPassword function is called with:", password); // Debugging
        const key = CryptoJS.enc.Utf8.parse(EncryptionKey);
        const encrypted = CryptoJS.TripleDES.encrypt(password, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        // console.log("Encrypted password:", encrypted.toString()); // Debugging
        return encrypted.toString();
    } catch (error) {
        console.error("Encryption error:", error);
        return error;
    }
};

module.exports = {
  encryptPassword
};
