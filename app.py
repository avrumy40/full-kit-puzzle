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

@app.before_request
def before_request():
    if 'player_id' not in session:
        session['player_id'] = str(uuid.uuid4())

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
        }, to=room_id, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    for room_id in game_rooms:
        if session['player_id'] in game_rooms[room_id]['players']:
            del game_rooms[room_id]['players'][session['player_id']]
            if len(game_rooms[room_id]['players']) == 0:
                del game_rooms[room_id]
            else:
                emit('player_left', {'player_count': len(game_rooms[room_id]['players'])}, to=room_id, broadcast=True)

@app.route('/analytics')
def analytics():
    # Sample data for charts
    time_data = {
        'labels': ['0-2 min', '2-4 min', '4-5 min', '5+ min'],
        'datasets': [{
            'label': 'Number of Games',
            'data': [4, 8, 5, 2],
            'backgroundColor': 'rgba(75, 192, 192, 0.2)',
            'borderColor': 'rgba(75, 192, 192, 1)',
            'borderWidth': 1
        }]
    }
    
    moves_data = {
        'labels': ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
        'datasets': [{
            'label': 'Number of Moves',
            'data': [15, 20, 18, 25, 22],
            'borderColor': 'rgba(54, 162, 235, 1)',
            'tension': 0.1
        }]
    }
    
    strategy_data = {
        'labels': ['Wait for All Pieces', 'Start Immediately', 'Mixed Strategy'],
        'datasets': [{
            'data': [6, 8, 5],
            'backgroundColor': [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)'
            ],
            'borderColor': [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
            ]
        }]
    }
    
    performance_data = {
        'labels': ['Time Efficiency', 'Move Efficiency', 'Completion Rate', 'Strategy Score', 'Adaptability'],
        'datasets': [{
            'label': 'Average Performance',
            'data': [85, 75, 90, 70, 80],
            'backgroundColor': 'rgba(255, 99, 132, 0.2)',
            'borderColor': 'rgba(255, 99, 132, 1)',
            'pointBackgroundColor': 'rgba(255, 99, 132, 1)'
        }]
    }
    
    return render_template('analytics.html',
                         time_data=time_data,
                         moves_data=moves_data,
                         strategy_data=strategy_data,
                         performance_data=performance_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
