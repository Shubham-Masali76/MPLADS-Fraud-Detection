import time
import logging

logger = logging.getLogger("mplads.twilio")

class TwilioBhashiniService:
    def __init__(self):
        self.twilio_number = "whatsapp:+14155238886" # Standard Twilio Sandbox Number
        self.bhashini_active = True

    def _mock_bhashini_translate_to_audio(self, english_text: str, target_lang: str) -> str:
        """
        Simulates the Indian Government's Bhashini AI translating text to localized speech audio.
        """
        print(f"\n[BHASHINI-AI] Requesting translation & TTS for language code: {target_lang}")
        time.sleep(1) # Simulate API latency
        if target_lang == "te-IN":
            print(f"[BHASHINI-AI] Translated to Telugu: 'Ee projectulo mosam jariginattu anumanam undi...'")
        elif target_lang == "hi-IN":
            print(f"[BHASHINI-AI] Translated to Hindi: 'Is pariyojana mein dhokhadhadi ka sandeh hai...'")
        
        print("[BHASHINI-AI] TTS Audio payload generated successfully.")
        return f"https://api.bhashini.gov.in/mock/audio/{target_lang}/alert_1029.mp3"

    def send_whatsapp_voice_alert(self, to_number: str, project_category: str, fraud_reasons: str, target_lang: str = "te-IN"):
        """
        Dispatches a Twilio WhatsApp message containing a Bhashini Voice Note.
        """
        print(f"\n[TWILIO-API] Initiating secure WhatsApp Gateway...")
        english_payload = f"VIGIL-AI ALERT: High probability of fraud detected on {project_category} project. Reasons: {fraud_reasons}"
        
        # 1. Translate via Bhashini
        audio_url = self._mock_bhashini_translate_to_audio(english_payload, target_lang)
        
        # 2. Dispatch via Twilio
        time.sleep(0.5)
        print(f"[TWILIO-API] Formatting WhatsApp interactive template...")
        print(f"[TWILIO-API] --------------------------------------------------")
        print(f"      TO: whatsapp:{to_number}")
        print(f"      FROM: {self.twilio_number}")
        print(f"      MEDIA_URL (Voice Note): {audio_url}")
        print(f"      STATUS: 201 CREATED (Queued for Delivery)")
        print(f"[TWILIO-API] --------------------------------------------------")
        print(f"[SYSTEM] The Sarpanch has received the alert in their native language.")

    def send_real_whatsapp_voice_alert(self, to_number: str, project_category: str, fraud_reasons: str, target_lang: str = "te-IN"):
        """
        Dispatches a REAL WhatsApp message using the Twilio Python SDK.
        """
        from twilio.rest import Client
        
        # We will inject the credentials here once the user provides them
        account_sid = "placeholder_sid"
        auth_token = "placeholder_token"
        
        if account_sid == "placeholder_sid":
            print("[TWILIO-API] Real credentials not provided yet. Falling back to simulation.")
            return self.send_whatsapp_voice_alert(to_number, project_category, fraud_reasons, target_lang)
            
        print(f"\n[TWILIO-API] Initiating REAL WhatsApp Gateway via Twilio SDK...")
        client = Client(account_sid, auth_token)
        
        english_payload = f"VIGIL-AI ALERT: High probability of fraud detected on {project_category} project. Reasons: {fraud_reasons}"
        audio_url = self._mock_bhashini_translate_to_audio(english_payload, target_lang)
        
        # Ensure numbers are formatted correctly for Twilio WhatsApp
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"
            
        try:
            message = client.messages.create(
                from_=self.twilio_number,
                to=to_number,
                body=f"VIGIL-AI ALERT ({project_category}): A localized voice note has been generated regarding potential irregularities.",
                media_url=[audio_url]
            )
            print(f"[TWILIO-API] SUCCESS! Message SID: {message.sid}")
            print(f"[SYSTEM] The Sarpanch's phone is buzzing right now.")
        except Exception as e:
            print(f"[TWILIO-API] ERROR sending real WhatsApp: {e}")


    def send_geofence_notification(self, project_id: int):
        print(f"\n[TWILIO-API] Initiating secure SMS/WhatsApp Gateway for Notification...")
        import time
        time.sleep(0.5)
        print(f"[TWILIO-API] --------------------------------------------------")
        print(f"      TO: whatsapp:+919876543210 (MP Dashboard) and +919876543211 (DC Dashboard)")
        print(f"      FROM: {self.twilio_number}")
        print(f"      MESSAGE: 'Alert: Day-0 Baseline Geofence coordinates locked for Project LIVE-{project_id}. EXIF data is verified. You may proceed to review and sanction.'")
        print(f"      STATUS: 201 CREATED (Queued for Delivery)")
        print(f"[TWILIO-API] --------------------------------------------------")
        print(f"[SYSTEM] WhatsApp/SMS notifications successfully dispatched to MP and District Authority.")


    def send_rejection_notification(self, project_id: int):
        print(f"\n[TWILIO-API] Initiating secure SMS/WhatsApp Gateway for Rejection Notification...")
        import time
        time.sleep(0.5)
        print(f"[TWILIO-API] --------------------------------------------------")
        print(f"      TO: whatsapp:+919876543210 (MP Dashboard)")
        print(f"      FROM: {self.twilio_number}")
        print(f"      MESSAGE: 'URGENT: Sanction for Project LIVE-{project_id} has been REJECTED by the District Authority due to suspicious EXIF/Geofence discrepancies.'")
        print(f"      STATUS: 201 CREATED (Queued for Delivery)")
        print(f"[TWILIO-API] --------------------------------------------------")

twilio_service = TwilioBhashiniService()
