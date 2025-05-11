import React from 'react';
import { GoogleLoginButton } from './GoogleLoginButton';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  return (
    <div className={styles.loginPage}>

      {/* Right Section */}
      <div className={styles.rightSection}>
        <div className={styles.card}>
          <h2>Create an account</h2>
          <GoogleLoginButton className={styles.googleLoginButton} />
          <p>
            By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
