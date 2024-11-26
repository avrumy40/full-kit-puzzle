from PIL import Image, ImageDraw

def create_face_puzzle():
    img = Image.new('RGB', (400, 400), 'white')
    draw = ImageDraw.Draw(img)
    
    # Draw face outline
    draw.ellipse([50, 50, 350, 350], outline='black', width=3)
    
    # Draw eyes
    draw.ellipse([125, 140, 175, 190], outline='black', width=3)
    draw.ellipse([225, 140, 275, 190], outline='black', width=3)
    
    # Draw nose
    draw.polygon([(185, 200), (215, 200), (200, 230)], outline='black', width=3)
    
    # Draw smile
    draw.arc([125, 180, 275, 300], 0, 180, fill='black', width=3)
    
    img.save('static/images/face_puzzle.png')

def create_animal_puzzle():
    img = Image.new('RGB', (400, 400), 'white')
    draw = ImageDraw.Draw(img)
    
    # Draw cat head
    draw.ellipse([50, 50, 350, 350], outline='black', width=3)
    
    # Draw ears
    draw.polygon([(100, 80), (50, 30), (150, 30)], outline='black', width=3)
    draw.polygon([(300, 80), (250, 30), (350, 30)], outline='black', width=3)
    
    # Draw eyes
    draw.ellipse([140, 160, 180, 200], outline='black', width=3)
    draw.ellipse([220, 160, 260, 200], outline='black', width=3)
    
    # Draw nose
    draw.polygon([(190, 220), (210, 220), (200, 235)], fill='black')
    
    # Draw whiskers
    for y, offset in [(210, -10), (220, 0), (230, 10)]:
        draw.line([120, y, 60, y + offset], fill='black', width=2)
        draw.line([280, y, 340, y + offset], fill='black', width=2)
    
    img.save('static/images/animal_puzzle.png')

def create_furniture_puzzle():
    img = Image.new('RGB', (400, 400), 'white')
    draw = ImageDraw.Draw(img)
    
    # Draw chair back
    draw.rectangle([100, 100, 300, 250], outline='black', width=3)
    
    # Draw chair seat
    draw.rectangle([100, 250, 300, 300], outline='black', width=3)
    
    # Draw chair legs
    draw.line([120, 300, 120, 350], fill='black', width=3)
    draw.line([280, 300, 280, 350], fill='black', width=3)
    
    # Draw chair back details
    for x in range(140, 281, 40):
        draw.line([x, 120, x, 230], fill='black', width=2)
    
    img.save('static/images/furniture_puzzle.png')

if __name__ == '__main__':
    create_face_puzzle()
    create_animal_puzzle()
    create_furniture_puzzle()
