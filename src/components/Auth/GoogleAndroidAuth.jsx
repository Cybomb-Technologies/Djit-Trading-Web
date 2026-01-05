import React, { useEffect, useState } from 'react';

const GoogleAndroidAuth = ({ onLoginSuccess, onLoginFailure, loading }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect mobile
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            return /android|iphone|ipad|ipod/i.test(userAgent);
        };
        setIsMobile(checkMobile());
    }, []);

    useEffect(() => {
        const initGSI = () => {
            if (!window.google || !window.google.accounts) {
                console.log("Waiting for Google Identity Services...");
                setTimeout(initGSI, 500);
                return;
            }

            try {
                // Initialize Google One Tap / Identity Services
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: (response) => {
                        if (response.credential) {
                            onLoginSuccess({ idToken: response.credential });
                        } else {
                            onLoginFailure("Failed to receive Google credentials");
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    context: 'signin',
                    ux_mode: isMobile ? 'redirect' : 'popup',
                    login_uri: window.location.origin + '/login',
                });

                // Render the standard Google button
                const parent = document.getElementById('google-button-container');
                if (parent) {
                    window.google.accounts.id.renderButton(parent, {
                        theme: 'outline',
                        size: 'large',
                        width: '100%',
                        text: 'continue_with',
                        shape: 'rectangular',
                    });
                }

                // Display One Tap prompt
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed()) {
                        console.log('One Tap not displayed:', notification.getNotDisplayedReason());
                    }
                });
            } catch (error) {
                console.error("GSI Init Error:", error);
                onLoginFailure("Failed to initialize Google Services");
            }
        };

        initGSI();
    }, [isMobile]);

    return (
        <div className="google-android-auth-container" style={{ width: '100%', minHeight: '40px' }}>
            <div id="google-button-container"></div>
        </div>
    );
};

export default GoogleAndroidAuth;
