import eventlet
import eventlet.wsgi
from app import app, socketio

if __name__ == "__main__":
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)
