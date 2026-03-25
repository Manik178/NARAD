import smtplib
import uuid
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv(".env.local")  
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

authority_emails = {
    "electricity_department": "creamercreamier@gmail.com",
    "water_department": "creamercreamier@gmail.com",
    "police_department": "creamercreamier@gmail.com",
    "municipal_corporation": "creamercreamier@gmail.com"
}

class ComplaintRouting(BaseModel):
    authorities: List[str]
    confidence_score: float
    summary: str

def send_email(to_email, subject, body, file_paths=None):
    """
    Sends email using SMTP with optional image attachments.
    """
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = "narad.sankalp@gmail.com"
    sender_password = os.getenv("EMAIL_PASSWORD") 

    # Use MIMEMultipart to support body + attachments
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))

    # Attach images if provided
    if file_paths:
        for path in file_paths:
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    img_data = f.read()
                    image = MIMEImage(img_data, name=os.path.basename(path))
                    msg.attach(image)

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

def identify_authority_with_llm(complaint_text):
    prompt = f"""
    Analyze the following complaint and identify all relevant departments from this list: 
    {list(authority_emails.keys())}.
    
    If the complaint involves multiple issues, select all applicable departments.
    Complaint: {complaint_text}
    """

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a government administrative routing assistant."},
            {"role": "user", "content": prompt}
        ],
        response_format=ComplaintRouting,
    )
    return completion.choices[0].message.parsed

def route_complaint(complaint_text, image_paths: Optional[List[str]] = None):
    routing_data = identify_authority_with_llm(complaint_text)
    complaint_id = str(uuid.uuid4())[:8]
    
    if routing_data.confidence_score < 0.6:
        return {"status": "error", "message": "Low confidence, manual review required."}

    sent_logs = []
    
    for auth in routing_data.authorities:
        if auth in authority_emails:
            target_email = authority_emails[auth]
            subject = f"Complaint ID: {complaint_id} - New Issue"
            body = (
                f"Complaint ID: {complaint_id}\n"
                f"Summary: {routing_data.summary}\n\n"
                f"Full Complaint: {complaint_text}"
            )
            
            success = send_email(target_email, subject, body, image_paths)
            if success:
                sent_logs.append(target_email)
            
    return {"id": complaint_id, "routed_to": sent_logs}

# --- Execution ---
if __name__ == "__main__":
    complaint = "The water pipe is leaking and it caused an electricity short circuit."
    # List of local paths to your images
    images = ["evidence1.jpg"] 
    
    result = route_complaint(complaint, image_paths=images)
    print(f"Routing result: {result}")