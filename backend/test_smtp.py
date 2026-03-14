import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()

print(f"SMTP Configuration:")
print(f"Email: '{SMTP_EMAIL}' (Length: {len(SMTP_EMAIL)})")
print(f"Password Length: {len(SMTP_PASSWORD)}")
print(f"Has spaces in password: {' ' in SMTP_PASSWORD}")

if not SMTP_EMAIL or not SMTP_PASSWORD:
    print("Error: Missing Email or Password")
    exit(1)

try:
    print("\nConnecting to smtp.gmail.com:465...")
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.set_debuglevel(1)  # Enable debug output
    
    print("\nAttempting login...")
    server.login(SMTP_EMAIL, SMTP_PASSWORD)
    
    print("\n✅ Login successful!")
    
    msg = EmailMessage()
    msg.set_content("This is a test email from Agri AI.")
    msg['Subject'] = 'Test Email'
    msg['From'] = SMTP_EMAIL
    msg['To'] = SMTP_EMAIL
    
    print("\nSending test email...")
    server.send_message(msg)
    
    server.quit()
    print("\n✅ Email sent successfully!")

except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ SMTP Authentication Error: {e.smtp_code} - {e.smtp_error.decode('utf-8')}")
    print("\nPossible solutions:")
    print("1. Ensure 2-Step Verification is ON for your Google account.")
    print("2. Ensure you are using an App Password, NOT your main account password.")
    print("3. Ensure the App Password has NO spaces.")
    print("4. Check if Google blocked the sign-in attempt (check your inbox/security alerts).")

except Exception as e:
    print(f"\n❌ Unexpected Error: {type(e).__name__}: {str(e)}")
