import os
from flask import Flask, render_template

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev_key_123")
app.debug = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

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
