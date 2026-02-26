import io
import os
import qrcode
import asyncio
import tempfile
from fastapi_mail import FastMail, MessageSchema, MessageType
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A6
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from .mail_config import conf
from .database import SessionLocal
from . import models

def generate_qr_code(data):
    """Generates a QR code image as bytes"""
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr

def generate_pdf(bookings):
    """Generates a PDF for a group of bookings (PNR) with a QR code"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A6)
    width, height = A6

    # Header Background
    c.setFillColor(colors.black)
    c.rect(0, height - 60, width, 60, fill=1)

    # Logo Text
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.white)
    c.drawString(20, height - 35, "ABC")
    c.setFillColor(colors.red)
    c.drawString(58, height - 35, "TRAVELS")

    # Content
    c.setStrokeColor(colors.lightgrey)
    c.setLineWidth(1)
    c.line(20, height - 80, width - 20, height - 80)

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20, height - 110, "BOARDING PASS")

    main_booking = bookings[0]
    seat_list = ", ".join([str(b.seat.seat_number) for b in bookings])
    
    details = [
        ("PNR NUMBER", f"#{main_booking.booking_number}"),
        ("FROM", main_booking.trip.source.upper()),
        ("TO", main_booking.trip.destination.upper()),
        ("SEAT(S)", seat_list),
        ("DEPARTURE", main_booking.trip.departure_time.strftime('%d %b %Y, %I:%M %p'))
    ]

    y_pos = height - 140
    for label, value in details:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(colors.red)
        c.drawString(20, y_pos, label)
        
        c.setFont("Helvetica", 11)
        c.setFillColor(colors.black)
        c.drawString(20, y_pos - 15, value)
        y_pos -= 45

    # QR Code
    qr_img_bytes = generate_qr_code(main_booking.booking_number)
    qr_img = ImageReader(qr_img_bytes)
    c.drawImage(qr_img, width - 80, 70, width=60, height=60)

    # Footer
    c.setDash(1, 2)
    c.line(20, 60, width - 20, 60)
    c.setDash()

    c.setFont("Helvetica-Oblique", 8)
    c.setFillColor(colors.grey)
    c.drawCentredString(width/2, 40, "Safe Journey with ABC Travels")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

async def send_booking_email_async(email_to: str, booking_number: str):
    """Internal async function to handle the actual sending"""
    db = SessionLocal()
    temp_path = None
    try:
        bookings = db.query(models.Booking).filter(
            models.Booking.booking_number == booking_number
        ).all()

        if not bookings:
            return "No bookings found"

        trip = bookings[0].trip
        seat_list = ", ".join([str(b.seat.seat_number) for b in bookings])
        admin_email = os.getenv("ADMIN_EMAIL")

        # 1. Generate PDF and save to temp file
        pdf_bytes = generate_pdf(bookings)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(pdf_bytes)
            temp_path = temp_file.name

        # 2. Professional HTML for User
        user_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background: #000; padding: 20px; text-align: center;">
                <h1 style="color: #fff; margin: 0; letter-spacing: -1px;">ABC <span style="color: #dc2626;">TRAVELS</span></h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #333;">Booking Confirmed!</h2>
                <p style="color: #666;">Your journey from <b>{trip.source}</b> to <b>{trip.destination}</b> is booked.</p>
                <div style="background: #f9fafb; border-radius: 15px; padding: 20px; margin: 25px 0; border-left: 5px solid #dc2626;">
                    <table style="width: 100%; font-size: 14px; border-spacing: 0 10px;">
                        <tr><td style="color: #999; width: 100px;">PNR</td><td><b>#{booking_number}</b></td></tr>
                        <tr><td style="color: #999;">SEATS</td><td><b>{seat_list}</b></td></tr>
                        <tr><td style="color: #999;">DEPARTURE</td><td><b>{trip.departure_time.strftime('%d %b, %I:%M %p')}</b></td></tr>
                    </table>
                </div>
                <p style="font-size: 12px; color: #999;">Please find your e-ticket attached to this email.</p>
            </div>
        </div>
        """

        # 3. Professional HTML for Admin
        admin_html = f"""
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #dc2626;">New Revenue Alert</h2>
            <p><b>PNR:</b> {booking_number}</p>
            <p><b>Customer:</b> {email_to}</p>
            <p><b>Trip:</b> {trip.source} to {trip.destination}</p>
            <p><b>Seats:</b> {seat_list}</p>
            <hr>
            <p style="font-size: 12px;">System Notification - ABC Travels</p>
        </div>
        """

        fm = FastMail(conf)

        # Send User Email
        user_msg = MessageSchema(
            subject=f"Trip Confirmation: {trip.source} to {trip.destination}",
            recipients=[email_to],
            body=user_html,
            subtype=MessageType.html,
            attachments=[temp_path]
        )
        await fm.send_message(user_msg)

        # Send Admin Email
        if admin_email:
            admin_msg = MessageSchema(
                subject=f"NEW BOOKING - {booking_number}",
                recipients=[admin_email],
                body=admin_html,
                subtype=MessageType.html
            )
            await fm.send_message(admin_msg)
            
        return f"Successfully sent emails for PNR {booking_number}"

    except Exception as e:
        print(f"Mail Utils Error: {e}")
        raise e
    finally:
        db.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

def send_booking_email_sync(email_to: str, booking_number: str):
    """Sync wrapper for Celery Solo Worker"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(send_booking_email_async(email_to, booking_number))
    finally:
        loop.close()