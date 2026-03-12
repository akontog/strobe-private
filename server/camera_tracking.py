"""
Strobe Camera Tracking - Python Backend
Χρησιμοποιεί OpenCV για αναγνώριση προσώπου/χεριού και στέλνει τις συντεταγμένες στον server
"""

import cv2
import numpy as np
import socketio
import time
import argparse

# Socket.IO client
sio = socketio.Client()

# Configuration
SERVER_URL = "http://localhost:3000"
TRACKING_MODE = "face"  # "face" or "hand"

# Face detection cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

class CameraTracker:
    def __init__(self, server_url=SERVER_URL, mode=TRACKING_MODE):
        self.server_url = server_url
        self.mode = mode
        self.connected = False
        self.position = (0.5, 0.5)  # Normalized x, y
        
    def connect(self):
        """Σύνδεση στον server"""
        try:
            sio.connect(self.server_url)
            self.connected = True
            print(f"✅ Συνδέθηκε στον server: {self.server_url}")
            return True
        except Exception as e:
            print(f"❌ Σφάλμα σύνδεσης: {e}")
            return False
    
    def disconnect(self):
        """Αποσύνδεση από τον server"""
        if self.connected:
            sio.disconnect()
            self.connected = False
            print("🔌 Αποσυνδέθηκε")
    
    def detect_face(self, frame):
        """Εντοπισμός προσώπου στο frame"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) > 0:
            # Παίρνουμε το πρώτο πρόσωπο
            x, y, w, h = faces[0]
            # Κέντρο του προσώπου
            center_x = x + w // 2
            center_y = y + h // 2
            
            # Σχεδιάζουμε ορθογώνιο και σημείο
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.circle(frame, (center_x, center_y), 10, (0, 0, 255), -1)
            
            return (center_x, center_y)
        
        return None
    
    def detect_hand(self, frame):
        """Εντοπισμός χεριού με color tracking (απλοποιημένο)"""
        # Μετατροπή σε HSV
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Skin color range (χοντρική εκτίμηση)
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Mask για το δέρμα
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Blur για καλύτερο αποτέλεσμα
        mask = cv2.GaussianBlur(mask, (5, 5), 0)
        
        # Βρίσκουμε contours
        contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Παίρνουμε το μεγαλύτερο contour
            max_contour = max(contours, key=cv2.contourArea)
            
            if cv2.contourArea(max_contour) > 5000:  # Minimum area
                # Βρίσκουμε το κέντρο
                M = cv2.moments(max_contour)
                if M["m00"] != 0:
                    center_x = int(M["m10"] / M["m00"])
                    center_y = int(M["m01"] / M["m00"])
                    
                    # Σχεδιάζουμε το contour και το κέντρο
                    cv2.drawContours(frame, [max_contour], -1, (0, 255, 0), 2)
                    cv2.circle(frame, (center_x, center_y), 10, (0, 0, 255), -1)
                    
                    return (center_x, center_y)
        
        return None
    
    def normalize_position(self, position, frame_shape):
        """Κανονικοποίηση συντεταγμένων σε 0-1"""
        x, y = position
        height, width = frame_shape[:2]
        
        normalized_x = x / width
        normalized_y = y / height
        
        # Clamp στο [0, 1]
        normalized_x = max(0.0, min(1.0, normalized_x))
        normalized_y = max(0.0, min(1.0, normalized_y))
        
        return (normalized_x, normalized_y)
    
    def send_position(self, x, y):
        """Αποστολή θέσης στον server"""
        if self.connected:
            try:
                sio.emit('user-position', {
                    'x': x,
                    'y': y,
                    'role': 'camera',
                    'color': '#FF6B6B'  # Κόκκινο για camera users
                })
            except Exception as e:
                print(f"❌ Σφάλμα αποστολής: {e}")
    
    def run(self):
        """Κύρια βρόχος tracking"""
        # Άνοιγμα κάμερας
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Δεν ήταν δυνατό το άνοιγμα της κάμερας")
            return
        
        print(f"📹 Κάμερα ενεργοποιήθηκε - Mode: {self.mode}")
        print("Πατήστε 'q' για έξοδο, 's' για αλλαγή mode")
        
        last_send_time = time.time()
        send_interval = 0.05  # 20 FPS
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Σφάλμα ανάγνωσης frame")
                break
            
            # Mirror για καλύτερη εμπειρία
            frame = cv2.flip(frame, 1)
            
            # Εντοπισμός ανάλογα με το mode
            if self.mode == "face":
                position = self.detect_face(frame)
            else:
                position = self.detect_hand(frame)
            
            # Αν βρέθηκε θέση, στέλνουμε στον server
            if position:
                normalized = self.normalize_position(position, frame.shape)
                self.position = normalized
                
                # Αποστολή με rate limiting
                current_time = time.time()
                if current_time - last_send_time >= send_interval:
                    self.send_position(normalized[0], normalized[1])
                    last_send_time = current_time
                
                # Εμφάνιση συντεταγμένων
                cv2.putText(frame, f"Position: ({normalized[0]:.2f}, {normalized[1]:.2f})", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Εμφάνιση mode και connection status
            status_color = (0, 255, 0) if self.connected else (0, 0, 255)
            cv2.putText(frame, f"Mode: {self.mode.upper()}", (10, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, "CONNECTED" if self.connected else "DISCONNECTED", 
                       (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
            
            # Εμφάνιση frame
            cv2.imshow('Strobe Camera Tracking', frame)
            
            # Keyboard controls
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                self.mode = "hand" if self.mode == "face" else "face"
                print(f"🔄 Αλλαγή mode σε: {self.mode}")
        
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        self.disconnect()


def main():
    parser = argparse.ArgumentParser(description='Strobe Camera Tracking')
    parser.add_argument('--server', default='http://localhost:3000', help='Server URL')
    parser.add_argument('--mode', choices=['face', 'hand'], default='face', help='Tracking mode')
    
    args = parser.parse_args()
    
    tracker = CameraTracker(server_url=args.server, mode=args.mode)
    
    if tracker.connect():
        try:
            tracker.run()
        except KeyboardInterrupt:
            print("\n⚠️ Διακοπή από χρήστη")
        finally:
            tracker.disconnect()
    else:
        print("❌ Αποτυχία σύνδεσης στον server")


if __name__ == "__main__":
    main()
