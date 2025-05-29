#!/usr/bin/env python3

import os
import asyncio
import json
import logging
from datetime import datetime
from aiohttp import web
import socketio

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("zerodha-hft")

# Create Socket.IO server
sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='aiohttp')
app = web.Application()
sio.attach(app)

# In-memory store
orders = []
positions = []
market_data = {}

# Routes
async def index(request):
    return web.Response(text="Zerodha HFT Backend API", content_type='text/plain')

# Socket.IO events
@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit('server_status', {'status': 'connected'}, to=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def subscribe_market_data(sid, data):
    """Subscribe to market data for specific instruments"""
    instruments = data.get('instruments', [])
    logger.info(f"Client {sid} subscribed to {instruments}")
    
    # In a real implementation, this would connect to Zerodha Kite WebSocket
    # For demo, we'll simulate market data
    asyncio.create_task(simulate_market_data(sid, instruments))

async def simulate_market_data(sid, instruments):
    """Simulate market data for demo purposes"""
    import random
    
    # Initial prices
    prices = {
        'NIFTY': 22428.35,
        'BANKNIFTY': 48246.10,
        'RELIANCE': 2345.50,
        'TCS': 3698.00,
        'HDFC': 1654.25,
        'INFY': 1845.25,
        'SBI': 745.80,
        'ICICI': 1025.40,
        'KOTAK': 1832.65,
    }
    
    try:
        while True:
            timestamp = datetime.now().isoformat()
            
            for instrument in instruments:
                if instrument in prices:
                    # Generate realistic price movement
                    change_pct = random.uniform(-0.05, 0.05)  # 0.05% movement max
                    price = prices[instrument] * (1 + change_pct)
                    prices[instrument] = price
                    
                    # Create tick data
                    tick = {
                        'instrument': instrument,
                        'ltp': round(price, 2),
                        'change': round(change_pct * 100, 2),
                        'volume': random.randint(100, 10000),
                        'bid': round(price * 0.999, 2),
                        'ask': round(price * 1.001, 2),
                        'timestamp': timestamp
                    }
                    
                    # Store in market data
                    market_data[instrument] = tick
                    
                    # Emit to client
                    await sio.emit('market_data', tick, to=sid)
            
            await asyncio.sleep(1)  # Update every second
    except Exception as e:
        logger.error(f"Error in market data simulation: {e}")

# API Routes for Orders and Positions
async def get_orders(request):
    return web.json_response(orders)

async def place_order(request):
    try:
        data = await request.json()
        
        # Validate order data
        required_fields = ['instrument', 'quantity', 'price', 'order_type', 'transaction_type']
        for field in required_fields:
            if field not in data:
                return web.json_response({'error': f'Missing required field: {field}'}, status=400)
        
        # Create order with unique ID and status
        order_id = f"ORD{len(orders) + 1:06d}"
        timestamp = datetime.now().isoformat()
        
        order = {
            'order_id': order_id,
            'instrument': data['instrument'],
            'quantity': data['quantity'],
            'price': data['price'],
            'order_type': data['order_type'],
            'transaction_type': data['transaction_type'],
            'status': 'PENDING',
            'timestamp': timestamp
        }
        
        orders.append(order)
        
        # In a real implementation, this would call Zerodha Kite API to place the order
        # Simulate order processing
        asyncio.create_task(process_order(order))
        
        return web.json_response({'message': 'Order placed successfully', 'order_id': order_id})
    
    except Exception as e:
        logger.error(f"Error placing order: {e}")
        return web.json_response({'error': str(e)}, status=500)

async def process_order(order):
    """Simulate order processing"""
    import random
    
    # Wait for a small random time to simulate processing
    await asyncio.sleep(random.uniform(0.1, 0.5))
    
    # 90% chance of success, 10% chance of rejection
    if random.random() < 0.9:
        order['status'] = 'COMPLETE'
        
        # Update positions based on the order
        update_position(order)
    else:
        order['status'] = 'REJECTED'
        order['rejection_reason'] = 'Insufficient funds'
    
    # Notify clients about order update
    await sio.emit('order_update', order)

def update_position(order):
    """Update positions based on completed orders"""
    instrument = order['instrument']
    quantity = order['quantity']
    
    # If transaction type is SELL, negate the quantity
    if order['transaction_type'] == 'SELL':
        quantity = -quantity
    
    # Check if position already exists
    position = next((p for p in positions if p['instrument'] == instrument), None)
    
    if position:
        # Update existing position
        position['quantity'] += quantity
        
        # If quantity becomes zero, remove the position
        if position['quantity'] == 0:
            positions.remove(position)
    else:
        # Create new position
        positions.append({
            'instrument': instrument,
            'quantity': quantity,
            'avg_price': order['price']
        })

async def get_positions(request):
    # Calculate current P&L based on market data
    for position in positions:
        instrument = position['instrument']
        if instrument in market_data:
            current_price = market_data[instrument]['ltp']
            avg_price = position['avg_price']
            quantity = position['quantity']
            
            # Calculate P&L
            position['pnl'] = round((current_price - avg_price) * quantity, 2)
    
    return web.json_response(positions)

# Setup routes
app.router.add_get('/', index)
app.router.add_get('/orders', get_orders)
app.router.add_post('/orders', place_order)
app.router.add_get('/positions', get_positions)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting HFT backend server on port {port}")
    web.run_app(app, port=port)