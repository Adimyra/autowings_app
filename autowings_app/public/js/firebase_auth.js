// Dynamically load Firebase scripts
const loadFirebaseScripts = () => {
    const scripts = [
        "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js",
        "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js"
    ];
    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.head.appendChild(script);
    });
};

loadFirebaseScripts();

const firebaseConfig = {
    apiKey: "AIzaSyAxeTp7b0Ja_cfR5u8mpapl-yrnziib3l8",
    authDomain: "autowings-94f68.firebaseapp.com",
    projectId: "autowings-94f68",
    storageBucket: "autowings-94f68.appspot.com",
    messagingSenderId: "514944071133",
    appId: "1:514944071133:web:f7dc5e043f2f86b8067234",
    measurementId: "G-3VDFFR9SV5"
};

// Wait for scripts to load before initializing
window.addEventListener('load', () => {
    firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
});

// Send OTP Function
function sendOTP(mobile) {
    const phoneNumber = "+91" + mobile;
    const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' });

    auth.signInWithPhoneNumber(phoneNumber, appVerifier)
        .then((confirmationResult) => {
            frappe.msgprint("OTP Sent Successfully.");
            cur_frm.set_value('firebase_verification_id', confirmationResult.verificationId);
            cur_frm.set_value('otp_sent', 1);
            cur_frm.set_value('otp_sent_at', frappe.datetime.now_datetime());
            cur_frm.save();
        })
        .catch((error) => {
            frappe.msgprint("Error Sending OTP: " + error.message);
        });
}

// Verify OTP Function
function verifyOTP(frm) {
    const otp = frm.doc.user_entered_otp;
    const verificationId = frm.doc.firebase_verification_id;
    const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);

    auth.signInWithCredential(credential)
        .then(() => {
            frappe.msgprint("OTP Verified Successfully.");
            frm.set_value('otp_verified', 1);
            frm.set_value('otp_verification_status', 'Verified');
            frm.set_value('otp_verified_at', frappe.datetime.now_datetime());
            frm.save();
        })
        .catch((error) => {
            frappe.msgprint("Invalid OTP: " + error.message);
            frm.set_value('otp_verification_status', 'Failed');
            frm.save();
        });
}



// Ensure Recaptcha Container Exists
if (!document.getElementById('recaptcha-container')) {
    const recaptchaDiv = document.createElement('div');
    recaptchaDiv.id = 'recaptcha-container';
    recaptchaDiv.style.display = 'none'; // Hide it visually
    document.body.appendChild(recaptchaDiv);
}
