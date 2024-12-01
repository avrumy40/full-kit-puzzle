# Theory of Constraints Full-Kit Puzzle Game

An educational puzzle game demonstrating the Theory of Constraints Full-kit concept through an interactive single-player experience.

## Features

- Single-player puzzle game with three frame types (face, animal, furniture)
- Batch release system demonstrating Full-kit principle
- Timer and progress tracking
- Performance analytics dashboard
- Educational feedback
- Dark theme support
- Audio feedback system

## Deployment on Replit

1. Fork this repository to your Replit account
2. The main entry point is `main.py`
3. Required secrets:
   - FLASK_SECRET_KEY: Used for session management (will be automatically generated if not provided)

## Development Setup

1. Install dependencies:
   ```bash
   python -m pip install -e .
   ```

2. Run the application:
   ```bash
   python main.py
   ```

## Tech Stack

- Backend: Flask
- Frontend: JavaScript
- Visualization: Chart.js
- Audio: Tone.js
- Styling: Bootstrap with Replit dark theme

## File Structure

- `app.py`: Main Flask application
- `static/`: Static assets (JS, CSS, images)
- `templates/`: HTML templates
- `generate_puzzle_images.py`: Puzzle image generation utilities

## License

MIT License
