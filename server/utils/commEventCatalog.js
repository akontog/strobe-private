// app: Εφαρμογή του event
// direction: Κατεύθυνση μηνύματος (in/out)
// event: Όνομα που χρησιμοποιείται στο WebSocket
// description: Περιγραφή του event (για τον προγραμματιστή)

const COMM_EVENT_CATALOG = Object.freeze([
  { app: 'polynomial-lab', direction: 'in', event: 'polynomial-lab:algebra_tiles_update', description: 'Participant updates the shared Algebra Tiles canvas.' },
  { app: 'polynomial-lab', direction: 'out', event: 'polynomial-lab:algebra_tiles_state', description: 'Server relays the validated Algebra Tiles canvas to participants.' },
  { app: 'socket', direction: 'in', event: 'socket:connect', description: 'WebSocket transport connected to server.' },
  { app: 'socket', direction: 'in', event: 'socket:disconnect', description: 'WebSocket transport disconnected from server.' },

  { app: 'geometry', direction: 'in', event: 'user-position', description: 'Client sends position update to server.' },
  { app: 'geometry', direction: 'in', event: 'camera-frame', description: 'Client sends camera frame to server for detection.' },
  { app: 'geometry', direction: 'in', event: 'camera-speed-frame', description: 'Client sends benchmark frame for camera speed test.' },
  { app: 'geometry', direction: 'in', event: 'activity-update', description: 'Teacher updates geometry activity on server.' },
  { app: 'geometry', direction: 'out', event: 'users-update', description: 'Server broadcasts active geometry points/users.' },
  { app: 'geometry', direction: 'out', event: 'camera-points', description: 'Server replies with detected camera points.' },
  { app: 'geometry', direction: 'out', event: 'camera-speed-result', description: 'Server replies with benchmark tracking frame and latency metrics.' },
  { app: 'geometry', direction: 'out', event: 'activity-loaded', description: 'Server pushes geometry activity snapshot.' },

  { app: 'buffon', direction: 'in', event: 'buffon:ws-connect', description: 'Buffon websocket connection established.' },
  { app: 'buffon', direction: 'in', event: 'buffon:ws-close', description: 'Buffon websocket connection closed.' },
  { app: 'buffon', direction: 'in', event: 'buffon:register_teacher', description: 'Teacher registers in Buffon channel.' },
  { app: 'buffon', direction: 'in', event: 'buffon:register_student', description: 'Student registers in Buffon channel.' },
  { app: 'buffon', direction: 'in', event: 'buffon:update', description: 'Student update message (drops/hits/piEst).' },
  { app: 'buffon', direction: 'in', event: 'buffon:start_round', description: 'Teacher starts a Buffon round.' },
  { app: 'buffon', direction: 'in', event: 'buffon:end_round', description: 'Teacher ends Buffon round and sends ranking.' },
  { app: 'buffon', direction: 'in', event: 'buffon:reset_tournament', description: 'Teacher resets Buffon tournament state.' },
  { app: 'buffon', direction: 'out', event: 'buffon:roster', description: 'Server sends current roster to teachers.' },
  { app: 'buffon', direction: 'out', event: 'buffon:round_start', description: 'Server pushes round start payload to students.' },
  { app: 'buffon', direction: 'out', event: 'buffon:round_end', description: 'Server pushes round end payload to students.' },
  { app: 'buffon', direction: 'out', event: 'buffon:reset_tournament', description: 'Server pushes tournament reset payload to students.' },

  { app: 'neural-lab', direction: 'in', event: 'neural-lab:ws-connect', description: 'Neural-lab websocket connection established.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:ws-close', description: 'Neural-lab websocket connection closed.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:register_teacher', description: 'Teacher registers in neural-lab channel.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:register_student', description: 'Student registers in neural-lab channel.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weight', description: 'Legacy student single-weight update.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:student_weights', description: 'Student updates personal w1/w2 sliders.' },
  { app: 'neural-lab', direction: 'in', event: 'neural-lab:teacher_config', description: 'Teacher updates input/output configuration.' },
  { app: 'neural-lab', direction: 'out', event: 'neural-lab:canvas_state', description: 'Server pushes synchronized state to teachers/students.' }
]);

module.exports = { COMM_EVENT_CATALOG };
