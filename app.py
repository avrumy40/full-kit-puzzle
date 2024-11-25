import os
import eventlet
eventlet.monkey_patch()
from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "dev_key_123"
socketio = SocketIO(app, async_mode='eventlet')

# Store active game rooms
game_rooms = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    # Generate unique session ID if not exists
    if 'player_id' not in session:
        session['player_id'] = str(uuid.uuid4())
    return render_template('game.html')

@socketio.on('create_game')
def handle_create_game():
    room_id = str(uuid.uuid4())[:8]
    game_rooms[room_id] = {
        'players': {},
        'started': False
    }
    join_room(room_id)
    game_rooms[room_id]['players'][session['player_id']] = {
        'ready': False,
        'progress': 0
    }
    emit('game_created', {'room_id': room_id})

@socketio.on('join_game')
def handle_join_game(data):
    room_id = data['room_id']
    if room_id in game_rooms and not game_rooms[room_id]['started']:
        join_room(room_id)
        game_rooms[room_id]['players'][session['player_id']] = {
            'ready': False,
            'progress': 0
        }
        emit('player_joined', {'player_count': len(game_rooms[room_id]['players'])}, to=room_id, broadcast=True)
    else:
        emit('join_error', {'message': 'Game not found or already started'})

@socketio.on('player_ready')
def handle_player_ready(data):
    room_id = data['room_id']
    if room_id in game_rooms:
        game_rooms[room_id]['players'][session['player_id']]['ready'] = True
        all_ready = all(player['ready'] for player in game_rooms[room_id]['players'].values())
        if all_ready and len(game_rooms[room_id]['players']) >= 2:
            game_rooms[room_id]['started'] = True
            emit('game_start', to=room_id, broadcast=True)

@socketio.on('update_progress')
def handle_progress_update(data):
    room_id = data['room_id']
    progress = data['progress']
    if room_id in game_rooms:
        game_rooms[room_id]['players'][session['player_id']]['progress'] = progress
        emit('progress_update', {
            'player_id': session['player_id'],
            'progress': progress
        }, room=room_id)

@socketio.on('disconnect')
def handle_disconnect():
    for room_id in game_rooms:
        if session['player_id'] in game_rooms[room_id]['players']:
            del game_rooms[room_id]['players'][session['player_id']]
            if len(game_rooms[room_id]['players']) == 0:
                del game_rooms[room_id]
            else:
                emit('player_left', {'player_count': len(game_rooms[room_id]['players'])}, to=room_id, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, log_output=True)
